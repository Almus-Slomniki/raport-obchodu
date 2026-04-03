// supabaseAudit.ts
import { Question } from './data/questions';
import { QuestionsState, ImagesState, NonCriticalEntry } from './components/types';
import { supabase } from './supabaseClient';

/* -------------------------------------------------------------------------- */
/*                            GET PRIVATE IMAGE URL                            */
/* -------------------------------------------------------------------------- */
export const getPrivateImageUrl = async (path: string, expiresIn = 300) => {
  const { data, error } = await supabase.storage
    .from('audit-images')
    .createSignedUrl(path, expiresIn);
  if (error) {
    console.error('❌ Błąd generowania signed URL:', error);
    return null;
  }
  return data?.signedUrl ?? null;
};

/* -------------------------------------------------------------------------- */
/*                               LOAD AUDIT DATA                               */
/* -------------------------------------------------------------------------- */
export const loadAuditData = async (auditId: number): Promise<{
  questions: QuestionsState;
  images: ImagesState;
  auditDate: string | null;
}> => {
  const { data, error } = await supabase
    .from('audit_answers')
    .select('*')
    .eq('audit_id', auditId);

  if (error) {
    console.error('❌ Błąd pobierania odpowiedzi:', error);
    return { questions: {} as QuestionsState, images: {} as ImagesState, auditDate: null };
  }

  const questions: QuestionsState = {};
  const images: ImagesState = {};

  for (const row of data || []) {
    if (!questions[row.category]) questions[row.category] = [];
    if (!images[row.category]) images[row.category] = {};

    // --- Parsowanie images ---
    let parsedImages: string[] = [];
    try {
      if (row.images) {
        if (typeof row.images === 'string') {
          parsedImages = row.images.trim() !== '' ? JSON.parse(row.images) : [];
        } else if (Array.isArray(row.images)) {
          parsedImages = row.images;
        }
      }
      if (!Array.isArray(parsedImages)) parsedImages = [];
    } catch (e) {
      console.warn(`Niepoprawny JSON w polu images audytu ${auditId}, pytanie ${row.question_id}`, e);
      parsedImages = [];
    }

    // --- Pobranie signed URL dla każdego obrazu ---
    const mappedImages: string[] = [];
    for (const imgPath of parsedImages) {
      const signedUrl = await getPrivateImageUrl(imgPath, 300);
      if (signedUrl) mappedImages.push(signedUrl);
    }

    // --- Mapowanie odpowiedzi ---
    const answerValue = row.answer;
    const mappedAnswer =
      answerValue === true || answerValue === 1 ? true :
      answerValue === false || answerValue === 0 ? false :
      undefined;

    const questionObj: Question & { disabled?: boolean } = {
      id: row.question_id?.toString() ?? '0',
      text: row.question_text ?? '[BRAK TEKSTU]',
      description: row.description ?? '',
      answer: mappedAnswer,
      note: row.note ?? '',
      images: mappedImages,
      disabled: row.disabled ?? false,
      category_comment: row.category_comment ?? "",
    };

    questions[row.category].push(questionObj);
    images[row.category][row.question_id] = mappedImages;
  }

  // --- Najstarsza data pytania ---
  const auditDate = data.length > 0
    ? data.reduce((min: string, row: any) =>
        new Date(row.created_at) < new Date(min) ? row.created_at : min,
      data[0].created_at)
    : null;

  return { questions, images, auditDate };
};

/* -------------------------------------------------------------------------- */
/*                                SAVE ANSWER                                 */
/* -------------------------------------------------------------------------- */
export const saveAnswer = async (auditId: number, category: string, question: Question) => {
  try {
    const imagesString = JSON.stringify(question.images || []);
    const safeAnswer = question.answer === true || question.answer === false ? question.answer : null;

    const { error } = await supabase
      .from('audit_answers')
      .upsert(
        {
          audit_id: auditId,
          category,
          question_id: Number(question.id),
          question_text: question.text,
          answer: safeAnswer,
          note: question.note ?? null,
          images: imagesString,
          updated_at: new Date(),
        },
        { onConflict: 'audit_id,category,question_id' }
      );

    if (error) console.error('❌ Błąd zapisu w Supabase:', error);
  } catch (err) {
    console.error('❌ saveAnswer error:', err);
  }
};

/* -------------------------------------------------------------------------- */
/*                                UPLOAD IMAGE                                */
/* -------------------------------------------------------------------------- */
const sanitizeFileName = (fileName: string) => {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return fileName.replace(/[^a-zA-Z0-9-_]/g, '_');
  const name = fileName.substring(0, lastDot).replace(/[^a-zA-Z0-9-_]/g, '_');
  const ext = fileName.substring(lastDot);
  return name + ext;
};

export const uploadImage = async (
  auditId: number,
  category: string,
  questionId: string,
  file: File
): Promise<string> => {
  const path = `audits/${auditId}/${sanitizeFileName(category)}/${sanitizeFileName(questionId)}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from('audit-images').upload(path, file);
  if (error) throw new Error(error.message);

  return path; // zapisujemy path w bazie
};

export const uploadNonCriticalImage = async (auditId: number, file: File): Promise<string> => {
  const path = `niekrytyczne/${auditId}/${Date.now()}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from('audit-images').upload(path, file);
  if (error) throw new Error(error.message);

  return path;
};

/* -------------------------------------------------------------------------- */
/*                         CHECK IF AUDIT FINISHED                            */
/* -------------------------------------------------------------------------- */
export const checkAuditFinished = async (auditId: number): Promise<boolean> => {
  const { data, error } = await supabase.from('audits').select('is_finished').eq('id', auditId).single();
  if (error || !data) return false;
  return data.is_finished === true;
};

/* -------------------------------------------------------------------------- */
/*                      FETCH LIST OF FINISHED AUDITS                         */
/* -------------------------------------------------------------------------- */
export const fetchFinishedAudits = async (): Promise<{ id: number; date: string }[]> => {
  const { data, error } = await supabase
    .from('audits')
    .select('id, created_at')
    .eq('is_finished', true)
    .order('id', { ascending: false });

  if (error) {
    console.error('❌ Błąd pobierania zakończonych audytów:', error);
    return [];
  }

  return data.map((a: any) => ({ id: a.id, date: new Date(a.created_at).toLocaleString() }));
};

/* -------------------------------------------------------------------------- */
/*                           NON-CRITICAL ENTRIES                             */
/* -------------------------------------------------------------------------- */
export const loadNonCriticalEntries = async (auditId: number): Promise<NonCriticalEntry[]> => {
  const { data, error } = await supabase
    .from("non_critical_entries")
    .select("*")
    .eq("audit_id", auditId)
    .order("id", { ascending: true });

  if (error) {
    console.error("❌ loadNonCriticalEntries:", error);
    return [];
  }

  return data as NonCriticalEntry[];
};

export const saveNonCriticalEntry = async (auditId: number, entry: NonCriticalEntry): Promise<NonCriticalEntry | null> => {
  try {
    const { data, error } = await supabase
      .from("non_critical_entries")
      .insert([{
        audit_id: auditId,
        name: entry.name,
        line: entry.line,
        images: entry.images || [],
        note: entry.note ?? null
      }])
      .select();

    if (error) {
      console.error("❌ saveNonCriticalEntry:", error);
      return null;
    }

    return (data && data[0]) as NonCriticalEntry;
  } catch (err) {
    console.error("❌ Błąd saveNonCriticalEntry:", err);
    return null;
  }
};

export const updateNonCriticalEntry = async (id: number, data: Partial<NonCriticalEntry>): Promise<boolean> => {
  const { error } = await supabase
    .from("non_critical_entries")
    .update({
      name: data.name,
      line: data.line,
      images: data.images,
      note: data.note
    })
    .eq("id", id);

  if (error) {
    console.error("❌ updateNonCriticalEntry:", error);
    return false;
  }

  return true;
};

export const deleteNonCriticalEntry = async (id: number): Promise<boolean> => {
  const { error } = await supabase
    .from("non_critical_entries")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("❌ deleteNonCriticalEntry:", error);
    return false;
  }

  return true;
};

/* -------------------------------------------------------------------------- */
/*                           SET CATEGORY DISABLED                             */
/* -------------------------------------------------------------------------- */
export const setCategoryDisabled = async (
  auditId: number,
  category: string,
  disabled: boolean,
  comment: string | null
) => {
  const { error } = await supabase
    .from("audit_answers")
    .update({
      disabled,
      category_comment: disabled ? comment : null,
      updated_at: new Date().toISOString(),
    })
    .eq("audit_id", auditId)
    .eq("category", category);

  if (error) {
    console.error("Błąd zapisu kategorii:", error);
    return false;
  }

  return true;
};

export { supabase };