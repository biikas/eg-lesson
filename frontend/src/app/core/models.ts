/** Shapes returned by the eglesson API (see the backend *Dtos classes). Optional fields may be omitted when null. */

export interface ApiResponse<T> { success: boolean; message?: string; data: T; }
export interface Page<T> { items: T[]; page: number; size: number; total: number; totalPages: number; }

export interface TreeNode {
  id: number; parentId?: number; name: string; shortName?: string; slug: string; description?: string;
  icon?: string; color?: string; coverImage?: string; typeId: number; typeCode: string; typeLabel: string;
  depth: number; sortOrder: number; active: boolean; featured: boolean; postCount: number; children: TreeNode[];
}
export interface NodeView {
  id: number; parentId?: number; name: string; shortName?: string; slug: string; description?: string;
  icon?: string; color?: string; coverImage?: string; typeId: number; typeCode: string; typeLabel: string;
  path: string; depth: number; sortOrder: number; active: boolean; featured: boolean;
}
export interface Crumb { id: number; name: string; slug: string; typeLabel: string; }
export interface ContentTypeCount { id: number; code: string; name: string; icon?: string; color?: string; count: number; }
export interface NodePage { node: NodeView; breadcrumb: Crumb[]; children: TreeNode[]; postCount: number; contentTypes: ContentTypeCount[]; }
export interface ContentType { id: number; code: string; name: string; icon?: string; color?: string; sortOrder: number; active: boolean; }
export interface NodeType { id: number; code: string; label: string; icon?: string; sortOrder: number; }

export interface TypeRef { id: number; code: string; name: string; icon?: string; color?: string; }
export interface NodeRef { id: number; name: string; slug: string; icon?: string; color?: string; pathLabel: string; }
export interface PostCard {
  id: number; title: string; slug: string; excerpt?: string; coverImage?: string; contentType: TypeRef; node?: NodeRef;
  language: string; difficulty?: string; readMinutes: number; publishedAt?: string; viewCount: number; likeCount: number;
  commentCount: number; featured: boolean; hasVideo: boolean; status: string; authorName?: string; updatedAt: string;
}
export interface Attachment { title: string; url: string; }
export interface PostDetail {
  card: PostCard; body: string; tags: string[]; attachments: Attachment[]; videoUrl?: string; breadcrumb: Crumb[];
  allowComments: boolean; metaTitle?: string; metaDescription?: string; bookmarkCount: number; liked: boolean;
  bookmarked: boolean; previous?: PostCard; next?: PostCard; related: PostCard[];
}
export type PostStatus = 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export interface PostEdit {
  id: number; title: string; slug: string; excerpt?: string; body?: string; coverImage?: string; nodeId: number; nodePath?: string;
  contentTypeId: number; language: string; difficulty?: string; videoUrl?: string; status: PostStatus; featured: boolean;
  allowComments: boolean; publishedAt?: string; metaTitle?: string; metaDescription?: string; tags: string[];
  attachments: Attachment[]; authorName?: string; viewCount: number; likeCount: number; commentCount: number;
  bookmarkCount: number; createdAt: string; updatedAt: string;
}
export interface Suggestion { kind: 'CATEGORY' | 'POST'; title: string; subtitle?: string; slug: string; icon?: string; color?: string; }
export interface SearchResult { categories: Suggestion[]; posts: Page<PostCard>; }

export interface CommentView {
  id: number; parentId?: number; authorName: string; authorColor?: string; team: boolean; mine: boolean; body: string;
  status: string; createdAt: string; replies: CommentView[];
}
export interface CommentRow { id: number; postId: number; postTitle: string; postSlug?: string; parentId?: number; authorName: string; team: boolean; body: string; status: string; createdAt: string; }
export interface Toggle { active: boolean; count: number; }
export interface HistoryItem { post: PostCard; progress: number; lastReadAt: string; }
export interface LearningStats { streak: number; bestStreak: number; notesOpened: number; notesCompleted: number; bookmarks: number; quizzesTaken: number; quizAverage?: number; activeDays: string[]; }

export interface NoticeView {
  id: number; title: string; slug: string; body?: string; category: string; important: boolean; attachmentUrl?: string;
  attachmentName?: string; nodeId?: number; publishAt: string; expireAt?: string; active: boolean; viewCount: number; updatedAt: string;
}
export interface PromoView {
  id: number; kind: 'BANNER' | 'AD'; title: string; subtitle?: string; imageUrl?: string; linkUrl?: string; ctaText?: string;
  placement: string; bgColor?: string; nodeId?: number; startAt?: string; endAt?: string; sortOrder: number; active: boolean;
  impressions: number; clicks: number;
}

export interface QuizCard { id: number; title: string; slug: string; description?: string; node?: NodeRef; questionCount: number; timeLimitMinutes: number; attemptCount: number; status: string; updatedAt: string; }
export interface PlayQuestion { id: number; text: string; options: { id: number; text: string }[]; }
export interface AttemptView { id: number; quizId: number; quizTitle: string; quizSlug: string; score: number; total: number; durationSeconds: number; createdAt: string; }
export interface PlayQuiz { quiz: QuizCard; questions: PlayQuestion[]; myAttempts: AttemptView[]; }
export interface QuizResult { score: number; total: number; percent: number; saved: boolean; questions: { questionId: number; chosenOptionId?: number; correctOptionId?: number; correct: boolean; explanation?: string }[]; }
export interface OptionForm { text: string; correct: boolean; }
export interface QuestionForm { text: string; explanation?: string; options: OptionForm[]; }
export interface QuizEdit { id: number; title: string; slug: string; description?: string; nodeId: number; nodePath?: string; timeLimitMinutes: number; status: string; questions: QuestionForm[]; }

export interface RequestView { id: number; nodeId?: number; nodePath?: string; topic: string; details?: string; status: string; adminNote?: string; postSlug?: string; postTitle?: string; studentName?: string; createdAt: string; updatedAt: string; }

export interface StudentMe { id: number; fullName: string; email?: string; phone?: string; courseNodeId?: number; courseSlug?: string; courseName?: string; school?: string; district?: string; avatarColor?: string; createdAt: string; }
export interface StudentSession { token: string; student: StudentMe; }
export interface AdminMe { id: number; username: string; fullName: string; email?: string; role: string; permissions: string[]; mustChangePassword: boolean; }
export interface AdminSession { token: string; admin: AdminMe; }
export interface AdminUserView { id: number; username: string; fullName: string; email?: string; roleId: number; roleName: string; active: boolean; mustChangePassword: boolean; lastLoginAt?: string; createdAt: string; }
export interface RoleView { id: number; name: string; description?: string; systemRole: boolean; permissions: string[]; userCount: number; }
export interface PermissionView { name: string; description: string; }
export interface StudentRow { id: number; fullName: string; email?: string; phone?: string; courseName?: string; school?: string; district?: string; active: boolean; lastLoginAt?: string; createdAt: string; }
export interface Media { id: number; originalName: string; url: string; contentType: string; sizeBytes: number; createdAt: string; }
export interface AuditLog { id: number; adminId?: number; adminName?: string; action: string; entity: string; entityId?: number; summary?: string; createdAt: string; }

export interface Point { date: string; value: number; }
export interface Named { id?: number; name: string; slug?: string; value: number; }
export interface Dashboard {
  totals: Record<string, number>; views: Point[]; signups: Point[]; activeStudents: Point[]; topPosts: Named[];
  uploadsToday: Named[]; uploadsWeek: Named[]; topSearches: Named[]; zeroResultSearches: Named[];
  emptySubjectCount: number; emptySubjects: { id: number; name: string; path: string }[]; recentActivity: AuditLog[];
}
export interface Home {
  streams: TreeNode[]; featuredNodes: NodeView[]; featured: PostCard[]; latest: PostCard[]; popular: PostCard[];
  notices: NoticeView[]; quizzes: QuizCard[]; totalNotes: number; totalSubjects: number;
}
