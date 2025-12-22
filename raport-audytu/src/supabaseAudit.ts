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
  console.log("🔄 Pobieram dane audytu:", auditId);

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

    const parsedImages = row.images ? JSON.parse(row.images) : [];

    questions[row.category].push({
      id: row.question_id.toString(),
      text: row.question_text,
      answer: row.answer,
      note: row.note,
      images: parsedImages,
    });

    images[row.category][row.question_id] = parsedImages;
  });

  // Pobieramy datę audytu z najstarszej created_at w audit_answers
  const auditDate = data.length > 0 ? data.reduce((min: string, row: any) => {
    return new Date(row.created_at) < new Date(min) ? row.created_at : min;
  }, data[0].created_at) : null;

  console.log("📥 Dane załadowane:", questions, "📅 Data audytu:", auditDate);
  return { questions, images, auditDate };
};


/* -------------------------------------------------------------------------- */
/*                                SAVE ANSWER                                 */
/* -------------------------------------------------------------------------- */
export const saveAnswer = async (auditId: number, category: string, question: Question) => {
  try {
    const imagesString = JSON.stringify(question.images || []);
    const safeAnswer: boolean | null = question.answer === true || question.answer === false ? question.answer : null;

    console.log('💾 Zapisuję odpowiedź:', { audit_id: auditId, category, question_id: Number(question.id), question_text: question.text, answer: safeAnswer, note: question.note, images: question.images });

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
        { onConflict: 'audit_id,category,question_id' } // Supabase wymaga dokładnie takiego formatu
      );

    if (error) console.error('❌ Błąd zapisu w Supabase:', error);
    else console.log('✅ Odpowiedź zapisana');
  } catch (err) {
    console.error('❌ Błąd zapisu odpowiedzi:', err);
  }
};

/* -------------------------------------------------------------------------- */
/*                                UPLOAD IMAGE                                */
/* -------------------------------------------------------------------------- */
export const uploadImage = async (auditId: number, category: string, questionId: string, file: File): Promise<string> => {
  const path = `audits/${auditId}/${category}/${questionId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from('audit-images').upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = await supabase.storage.from('audit-images').getPublicUrl(path);
  return urlData?.publicUrl ?? '';
};

/* -------------------------------------------------------------------------- */
/*                         CHECK IF AUDIT FINISHED                            */
/* -------------------------------------------------------------------------- */
export const checkAuditFinished = async (auditId: number): Promise<boolean> => {
  const { data, error } = await supabase.from('audits').select('is_finished').eq('id', auditId).single();
  if (error || !data) {
    console.error('❌ checkAuditFinished error:', error);
    return false;
  }
  return data.is_finished === true;
};

/* -------------------------------------------------------------------------- */
/*                      FETCH LIST OF FINISHED AUDITS                         */
/* -------------------------------------------------------------------------- */
export const fetchFinishedAudits = async (): Promise<{ id: number; date: string }[]> => {
  const { data, error } = await supabase.from('audits').select('id, created_at').eq('is_finished', true).order('id', { ascending: false });
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
    console.error("❌ Błąd pobierania non-critical:", error);
    return [];
  }

  return (data || []) as NonCriticalEntry[];
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
          images: entry.images || []
        }
      ])
      .select(); // bardzo ważne, bo bez select Supabase nic nie zwraca
    if (error) {
      console.error("❌ Błąd zapisu non-critical:", error);
      return null;
    }
console.log("entryten", data)

    return (data && data[0]) as NonCriticalEntry;
  } catch (err) {
    console.error("❌ Błąd saveNonCriticalEntry:", err);
    return null;
  }
};

export const uploadNonCriticalImage = async (auditId: number, file: File): Promise<string> => {
  const path = `niekrytyczne/${auditId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage.from("audit-images").upload(path, file);
  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = await supabase.storage.from("audit-images").getPublicUrl(path);
  return urlData?.publicUrl ?? "";
};

export { supabase };

