import { Question } from './data/questions';
import { QuestionsState, ImagesState } from './components/types';
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

  // 1️⃣ Pobranie odpowiedzi
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

  // 2️⃣ Pobranie daty audytu
  const { data: auditMeta, error: auditError } = await supabase
    .from('audits')
    .select('created_at')
    .eq('id', auditId)
    .single();

  if (auditError) {
    console.error('❌ Błąd pobierania daty audytu:', auditError);
  }

  const auditDate = auditMeta?.created_at ?? null;

  console.log("📥 Dane załadowane:", questions, "📅 Data audytu:", auditDate);
  return { questions, images, auditDate };
};

/* -------------------------------------------------------------------------- */
/*                                SAVE ANSWER                                 */
/* -------------------------------------------------------------------------- */

export const saveAnswer = async (auditId: number, category: string, question: Question) => {
  try {
    const imagesString = JSON.stringify(question.images || []);

    let safeAnswer: boolean | null = null;
    if (question.answer === true || question.answer === false) safeAnswer = question.answer;

    console.log('💾 Zapisuję odpowiedź:', {
      audit_id: auditId,
      category,
      question_id: Number(question.id),
      question_text: question.text,
      answer: safeAnswer,
      note: question.note,
      images: question.images,
    });

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
        { onConflict: 'audit_id, category, question_id' }
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

export const uploadImage = async (
  auditId: number,
  category: string,
  questionId: string,
  file: File
): Promise<string> => {
  const path = `audits/${auditId}/${category}/${questionId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from('audit-images')
    .upload(path, file);

  if (uploadError) {
    console.error("❌ Błąd uploadu:", uploadError);
    throw new Error(uploadError.message);
  }

  const { data: urlData } = await supabase.storage
    .from('audit-images')
    .getPublicUrl(path);

  return urlData?.publicUrl ?? '';
};

/* -------------------------------------------------------------------------- */
/*                         CHECK IF AUDIT FINISHED                            */
/* -------------------------------------------------------------------------- */

export const checkAuditFinished = async (auditId: number): Promise<boolean> => {
  const { data, error } = await supabase
    .from('audits')
    .select('is_finished')
    .eq('id', auditId)
    .single();

  if (error || !data) {
    console.error('❌ checkAuditFinished error:', error);
    return false;
  }

  return data.is_finished === true;
};

/* -------------------------------------------------------------------------- */
/*                      FETCH LIST OF FINISHED AUDITS                         */
/* -------------------------------------------------------------------------- */

export const fetchFinishedAudits = async (): Promise<
  { id: number; date: string }[]
> => {
  const { data, error } = await supabase
    .from('audits')
    .select('id, created_at')
    .eq('is_finished', true)
    .order('id', { ascending: false });

  if (error) {
    console.error('❌ Błąd pobierania zakończonych audytów:', error);
    return [];
  }

  return data.map((a: any) => ({
    id: a.id,
    date: new Date(a.created_at).toLocaleString(),
  }));
};
