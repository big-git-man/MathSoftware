// Generated-style database types for the Supabase Postgres schema.
// Mirrors supabase/migrations. `Insert`/`Update` use Partial<Row> so
// auto-generated columns may be omitted; row-level validation is enforced
// server-side (constraints + RLS).

export type UUID = string;

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: Table<Db.ProfilesRow>
      subjects: Table<Db.SubjectsRow>
      courses: Table<Db.CoursesRow>
      units: Table<Db.UnitsRow>
      topics: Table<Db.TopicsRow>
      lessons: Table<Db.LessonsRow>
      tags: Table<Db.TagsRow>
      assignments: Table<Db.AssignmentsRow>
      assignment_documents: Table<Db.AssignmentDocumentsRow>
      documents: Table<Db.DocumentsRow>
      document_pages: Table<Db.DocumentPagesRow>
      document_tags: Table<Db.DocumentTagsRow>
      document_processing_jobs: Table<Db.DocumentProcessingJobsRow>
      practice_questions: Table<Db.PracticeQuestionsRow>
      study_sessions: Table<Db.StudySessionsRow>
      question_attempts: Table<Db.QuestionAttemptsRow>
      mistakes: Table<Db.MistakesRow>
      level_thresholds: Table<Db.LevelThresholdsRow>
      user_progression: Table<Db.UserProgressionRow>
      xp_transactions: Table<Db.XpTransactionsRow>
      user_activity_logs: Table<Db.UserActivityLogsRow>
      achievements: Table<Db.AchievementsRow>
      user_achievements: Table<Db.UserAchievementsRow>
      missions: Table<Db.MissionsRow>
      user_missions: Table<Db.UserMissionsRow>
      topic_mastery: Table<Db.TopicMasteryRow>
      lesson_completions: Table<Db.LessonCompletionsRow>
      ai_conversations: Table<Db.AiConversationsRow>
      ai_messages: Table<Db.AiMessagesRow>
    }
    Views: { [_ in never]: never }
    Functions: DatabaseFunctions
    Enums: Db.DbEnums
  }
}

// Generic helper for Supabase-style table shapes. Insert/Update allow partial
// payloads so auto-generated columns can be omitted.
export type Table<Row> = {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
}

// Namespace holding every row type so the public.Tables map stays readable.
export namespace Db {
  export type DbEnums = {
    assignment_type: 'homework' | 'classwork' | 'worksheet' | 'test' | 'exam' | 'revision' | 'notes' | 'other'
    assignment_status: 'draft' | 'pending' | 'in_progress' | 'completed' | 'archived'
    document_type: 'homework' | 'classwork' | 'worksheet' | 'test' | 'exam' | 'revision' | 'notes' | 'other'
    processing_status: 'uploading' | 'processing' | 'ocr' | 'analyzing' | 'ready' | 'failed'
    difficulty_level: 'easy' | 'medium' | 'hard'
    session_kind: 'practice' | 'revision' | 'boss' | 'exam' | 'homework_check'
    mistake_kind: 'conceptual' | 'calculation' | 'sign' | 'formula' | 'reading' | 'method' | 'unknown'
    activity_kind: 'practice' | 'homework' | 'classwork' | 'lesson' | 'mission' | 'study_session' | 'streak_bonus' | 'achievement'
  }

  export interface ProfilesRow {
    id: UUID
    display_name: string | null
    avatar_url: string | null
    timezone: string | null
    locale: string | null
    onboarding_completed: boolean | null
    created_at: string | null
    updated_at: string | null
  }
  export interface SubjectsRow {
    id: UUID
    user_id: UUID
    name: string
    description: string | null
    icon: string | null
    color: string | null
    position: number | null
    created_at: string | null
    updated_at: string | null
  }
  export interface CoursesRow {
    id: UUID
    user_id: UUID
    subject_id: UUID
    name: string
    description: string | null
    position: number | null
    metadata: Json | null
    created_at: string | null
    updated_at: string | null
  }
  export interface UnitsRow {
    id: UUID
    user_id: UUID
    course_id: UUID
    name: string
    description: string | null
    position: number | null
    created_at: string | null
    updated_at: string | null
  }
  export interface TopicsRow {
    id: UUID
    user_id: UUID
    unit_id: UUID
    name: string
    description: string | null
    position: number | null
    color: string | null
    difficulty: string | null
    created_at: string | null
    updated_at: string | null
  }
  export interface LessonsRow {
    id: UUID
    user_id: UUID
    topic_id: UUID
    title: string
    content: string | null
    position: number | null
    duration_minutes: number | null
    metadata: Json | null
    created_at: string | null
    updated_at: string | null
  }
  export interface TagsRow {
    id: UUID
    user_id: UUID
    name: string
    color: string | null
    created_at: string | null
  }
  export interface AssignmentsRow {
    id: UUID
    user_id: UUID
    name: string
    course_id: UUID | null
    unit_id: UUID | null
    topic_id: UUID | null
    type: DbEnums['assignment_type']
    due_date: string | null
    due_date_end: string | null
    status: DbEnums['assignment_status'] | null
    metadata: Json | null
    created_at: string | null
    updated_at: string | null
  }
  export interface AssignmentDocumentsRow {
    assignment_id: UUID
    document_id: UUID
    sort_order: number | null
  }
  export interface DocumentsRow {
    id: UUID
    user_id: UUID
    original_filename: string
    storage_bucket: string
    storage_path: string
    thumbnail_path: string | null
    mime_type: string
    extension: string | null
    file_size: number | null
    width: number | null
    height: number | null
    page_count: number | null
    upload_date: string | null
    document_type: DbEnums['document_type']
    subject_id: UUID | null
    course_id: UUID | null
    unit_id: UUID | null
    topic_id: UUID | null
    assignment_id: UUID | null
    ai_title: string | null
    ai_summary: string | null
    ai_difficulty: string | null
    ai_classification: Json | null
    ocr_text: string | null
    ocr_locale: string | null
    processing_status: DbEnums['processing_status'] | null
    is_favorite: boolean | null
    captured_at: string | null
    created_at: string | null
    updated_at: string | null
  }
  export interface DocumentPagesRow {
    id: UUID
    document_id: UUID
    user_id: UUID
    page_number: number
    thumbnail_path: string | null
    width: number | null
    height: number | null
  }
  export interface DocumentTagsRow {
    document_id: UUID
    tag_id: UUID
  }
  export interface DocumentProcessingJobsRow {
    id: UUID
    document_id: UUID
    user_id: UUID
    status: string
    stage: string | null
    started_at: string | null
    completed_at: string | null
    error: string | null
    attempts: number | null
    created_at: string | null
    updated_at: string | null
  }
  export interface PracticeQuestionsRow {
    id: UUID
    user_id: UUID | null
    topic_id: UUID | null
    course_id: UUID | null
    difficulty: DbEnums['difficulty_level'] | null
    question: string
    correct_answer: string | null
    answer_type: string | null
    options: Json | null
    explanation: string | null
    solution_steps: Json | null
    skills_tested: string[] | null
    source_document_id: UUID | null
    metadata: Json | null
    created_at: string | null
    updated_at: string | null
  }
  export interface StudySessionsRow {
    id: UUID
    user_id: UUID
    kind: DbEnums['session_kind']
    subject_id: UUID | null
    topic_id: UUID | null
    start_time: string | null
    end_time: string | null
    duration_seconds: number | null
    xp_earned: number | null
    metadata: Json | null
    created_at: string | null
    updated_at: string | null
  }
  export interface QuestionAttemptsRow {
    id: UUID
    user_id: UUID
    session_id: UUID | null
    question_id: UUID | null
    topic_id: UUID | null
    student_answer: string | null
    correct: boolean
    points: number | null
    time_spent_ms: number | null
    hint_used: boolean | null
    difficulty: DbEnums['difficulty_level'] | null
    created_at: string | null
  }
  export interface MistakesRow {
    id: UUID
    user_id: UUID
    question_id: UUID | null
    attempt_id: UUID | null
    topic_id: UUID | null
    mistake_type: DbEnums['mistake_kind'] | null
    description: string | null
    created_at: string | null
  }
  export interface LevelThresholdsRow { level: number; cumulative_xp: number }
  export interface UserProgressionRow {
    user_id: UUID
    current_level: number | null
    current_xp: number | null
    total_xp: number | null
    last_xp_at: string | null
    current_streak: number | null
    longest_streak: number | null
    last_activity_date: string | null
    updated_at: string | null
  }
  export interface XpTransactionsRow {
    id: UUID
    user_id: UUID
    amount: number
    reason: string
    description: string | null
    entity_type: string | null
    entity_id: UUID | null
    balance_after: number | null
    source: string | null
    transaction_key: string | null
    created_at: string | null
  }
  export interface UserActivityLogsRow {
    id: UUID
    user_id: UUID
    activity_type: DbEnums['activity_kind']
    activity_date: string
    metadata: Json | null
    created_at: string | null
  }
  export interface AchievementsRow {
    id: UUID
    code: string
    name: string
    description: string | null
    icon: string | null
    category: string | null
    requirement_type: string | null
    requirement_value: Json | null
    xp_reward: number | null
    created_at: string | null
  }
  export interface UserAchievementsRow {
    user_id: UUID
    achievement_id: UUID
    unlocked_at: string | null
  }
  export interface MissionsRow {
    id: UUID
    code: string
    type: string
    name: string
    description: string | null
    xp_reward: number
    requirement: Json
    created_at: string | null
  }
  export interface UserMissionsRow {
    user_id: UUID
    mission_id: UUID
    date_key: string
    status: string
    progress: number | null
    target: number | null
    completed_at: string | null
  }
  export interface TopicMasteryRow {
    user_id: UUID
    topic_id: UUID
    mastery_score: string | null  // numeric(5,2)
    evidence: Json | null
    last_practiced: string | null
    updated_at: string | null
  }
  export interface LessonCompletionsRow {
    user_id: UUID
    lesson_id: UUID
    completed_at: string | null
  }
  export interface AiConversationsRow {
    id: UUID
    user_id: UUID
    title: string | null
    document_id: UUID | null
    topic_id: UUID | null
    model: string | null
    created_at: string | null
    updated_at: string | null
  }
  export interface AiMessagesRow {
    id: UUID
    conversation_id: UUID
    role: string
    content: string
    created_at: string | null
  }
}

  // RPC function signatures used by the typed client.
  
type DatabaseFunctions = {
  apply_owner_policies: {
    Args: { p_table: unknown; p_user_col: string }
    Returns: void
  }
  enable_readable_catalog: { Args: { p_table: string }; Returns: void }
  award_xp: {
    Args: {
      p_user: UUID
      p_amount: number
      p_reason: string
      p_description?: string | null
      p_entity_type?: string | null
      p_entity_id?: UUID | null
      p_source?: string | null
      p_transaction_key?: string | null
    }
    Returns: number
  }
  log_activity: {
    Args: { p_user: UUID; p_kind: Db.DbEnums['activity_kind']; p_date?: string | null; p_metadata?: Json | null }
    Returns: number
  }
  recompute_streak: { Args: { p_user: UUID }; Returns: number }
  generate_missions: {
    Args: { p_user: UUID; p_date?: string | null }
    Returns: {
      mission_id: UUID
      code: string
      type: string
      name: string
      progress: number
      target: number
      status: string
      xp_reward: number
    }[]
  }
  advance_mission: { Args: { p_user: UUID; p_code: string; p_increment?: number | null }; Returns: boolean }
  complete_lesson: { Args: { p_user: UUID; p_lesson: UUID }; Returns: void }
  check_achievements: { Args: { p_user: UUID }; Returns: { achievement_id: UUID; code: string; unlocked: boolean }[] }
  update_topic_mastery: {
    Args: { p_user: UUID; p_topic: UUID; p_correct: boolean; p_difficulty: string; p_attempt_ts?: string | null }
    Returns: number
  }
  init_default_curriculum: { Args: { p_user: UUID }; Returns: void }
}

// Convenience helpers (same shape as @supabase/supabase-js).
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];
