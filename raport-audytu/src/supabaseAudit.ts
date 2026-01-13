// supabaseAudit.ts
import { Question } from './data/questions';
import { QuestionsState, ImagesState, NonCriticalEntry } from './components/types';
import { supabase } from './supabaseClient';

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

  (data || []).forEach((row: any) => {
    if (!questions[row.category]) questions[row.category] = [];
    if (!images[row.category]) images[row.category] = {};

    // BEZPIECZNE PARSOWANIE IMAGES
    let parsedImages: string[] = [];
    try {
      parsedImages = row.images ? JSON.parse(row.images) : [];
      if (!Array.isArray(parsedImages)) parsedImages = [];
    } catch (e) {
      console.warn(`Niepoprawny JSON w polu images audytu ${auditId}, pytanie ${row.question_id}`, e);
      parsedImages = [];
    }

    questions[row.category].push({
      id: row.question_id.toString(),
      text: row.question_text,
      answer: row.answer,
      note: row.note ?? '',
      images: parsedImages,
    });

    images[row.category][row.question_id] = parsedImages;
  });

  // Najstarsza data pytania
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
export const uploadImage = async (auditId: number, category: string, questionId: string, file: File): Promise<string> => {
  const path = `audits/${auditId}/${category}/${questionId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from('audit-images').upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from('audit-images').getPublicUrl(path);
  return data?.publicUrl ?? '';
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
      .insert([
        {
          audit_id: auditId,
          name: entry.name,
          line: entry.line,
          images: entry.images || [],
          note: entry.note ?? null
        }
      ])
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

export const uploadNonCriticalImage = async (auditId: number, file: File): Promise<string> => {
  const path = `niekrytyczne/${auditId}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("audit-images").upload(path, file);
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("audit-images").getPublicUrl(path);
  return data?.publicUrl ?? "";
};

export { supabase };
