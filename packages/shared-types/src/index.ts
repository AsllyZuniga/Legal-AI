// ============================================
// SHARED TYPES - Asistente Juridico Inteligente
// ============================================

// --- User & Auth ---
export interface User {
  id: string;
  email: string;
  fullName: string;
  lawFirm?: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  credits: number;
  dailyCreditsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'lawyer';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  lawFirm?: string;
  phone?: string;
}

// --- Cases ---
export interface Case {
  id: string;
  userId: string;
  name: string;
  description?: string;
  legalArea: LegalArea;
  subarea?: string;
  parties?: CaseParties;
  pretensions?: string;
  legalProblemDescription?: string;
  previousProceedings?: any[];
  previousDecisions?: any[];
  additionalInfo?: string;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus = 'active' | 'archived';

export interface CaseParties {
  demandantes?: Party[];
  demandados?: Party[];
  testigos?: Party[];
  otros?: Party[];
}

export interface Party {
  name: string;
  documentType?: string;
  documentNumber?: string;
  role?: string;
  address?: string;
  phone?: string;
}

// --- Case Facts ---
export interface CaseFact {
  id: string;
  caseId: string;
  factType: FactType;
  description: string;
  eventDate?: string;
  eventDateText?: string;
  isDateExact: boolean;
  chronologicalOrder?: number;
  isJuridicallyRelevant: boolean;
  relevanceExplanation?: string;
  sourceType?: string;
  sourceDocumentId?: string;
  sourcePage?: number;
  sourceQuote?: string;
  verificationStatus: VerificationStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export type FactType =
  | 'user_reported'
  | 'documented'
  | 'ai_inferred'
  | 'needs_verification';

export type VerificationStatus =
  | 'unverified'
  | 'verified'
  | 'contradicted'
  | 'needs_evidence';

// --- Case Events (Timeline) ---
export interface CaseEvent {
  id: string;
  caseId: string;
  factId?: string;
  description: string;
  eventDate: string;
  isDateExact: boolean;
  chronologicalOrder: number;
  isJuridicallyRelevant: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

// --- Case Pretensions ---
export interface CasePretension {
  id: string;
  caseId: string;
  description: string;
  legalBasis?: string;
  estimatedValue?: number;
  currency: string;
  status: 'proposed' | 'accepted' | 'rejected';
  createdAt: string;
}

// --- Case Defenses ---
export interface CaseDefense {
  id: string;
  caseId: string;
  defenseType: 'exception' | 'defense' | 'argument';
  description: string;
  legalBasis?: string;
  strength: 'strong' | 'medium' | 'weak';
  sourceRulingId?: string;
  createdAt: string;
}

// --- Case Alerts ---
export interface CaseAlert {
  id: string;
  caseId: string;
  alertType: AlertType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation?: string;
  relatedFactId?: string;
  relatedRulingId?: string;
  isAcknowledged: boolean;
  acknowledgedAt?: string;
  createdAt: string;
}

export type AlertType =
  | 'prescription'
  | 'caducidad'
  | 'procedural_deadline'
  | 'lack_competence'
  | 'lack_legitimacy'
  | 'evidentiary_deficit'
  | 'adverse_jurisprudence'
  | 'normative_change'
  | 'jurisprudential_change'
  | 'contradictory_info'
  | 'missing_info';

// --- Case Tasks ---
export interface CaseTask {
  id: string;
  caseId: string;
  description: string;
  taskType: 'evidence' | 'deadline' | 'research' | 'action';
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  isCompleted: boolean;
  createdBy: 'system' | 'user';
  createdAt: string;
}

// --- Legal Areas ---
export type LegalArea =
  | 'familia'
  | 'civil'
  | 'responsabilidad_civil'
  | 'laboral'
  | 'contencioso_administrativo'
  | 'penal'
  | 'comercial'
  | 'tributario'
  | 'procesal'
  | 'disciplinario'
  | 'constitucional'
  | 'otro';

// --- Rulings (Sentencias) ---
export interface Ruling {
  id: string;
  citation: string;
  rulingType: string;
  processType?: string;
  corporation: Corporation;
  chamber?: string;
  magistratePonent?: string;
  magistrates?: string;
  rulingDate?: string;
  publicationDate?: string;
  legalArea?: LegalArea;
  themes?: string[];
  subthemes?: string[];
  summary?: string;
  resuelve?: string;
  sourceUrl?: string;
  sourceType: 'official' | 'user_upload';
  pdfUrl?: string;
  radicado?: string;
  referencedNorms?: string[];
  citedRulings?: string[];
  citingRulings?: string[];
  similarityScore?: number;
  aiAnalysis?: RulingAnalysis;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
}

export type Corporation =
  | 'corte_constitucional'
  | 'corte_suprema'
  | 'consejo_estado'
  | 'consejo_superior_judicatura'
  | 'comision_nacional_disciplina'
  | 'tribunal_superior'
  | 'tribunal_administrativo'
  | 'otro';

export interface RulingAnalysis {
  hechos?: string;
  problemaJuridico?: string;
  argumentos?: string;
  decision?: string;
  reglaJuridica?: string;
}

// --- Ruling Chunks ---
export interface RulingChunk {
  id: string;
  rulingId: string;
  content: string;
  sectionType?: string;
  sectionTitle?: string;
  hierarchyPath?: string;
  pageNumbers?: string;
  chunkLevel: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

// --- User Documents ---
export interface UserDocument {
  id: string;
  userId: string;
  caseId?: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
  extractionMethod?: string;
  extractionConfidence?: number;
  extractedText?: string;
  documentCategory?: string;
  aiAnalysis?: DocumentAnalysis;
  embeddingStatus: 'pending' | 'processing' | 'completed' | 'error';
  linkedFactIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentAnalysis {
  datesFound?: string[];
  personsFound?: string[];
  obligationsFound?: string[];
  statements?: string[];
  evidence?: string[];
  contradictions?: string[];
  relevantInfo?: string[];
}

// --- Conversations ---
export interface Conversation {
  id: string;
  userId: string;
  caseId?: string;
  title?: string;
  analysisMode: AnalysisMode;
  contextId?: string;
  createdAt: string;
  updatedAt: string;
}

export type AnalysisMode =
  | 'general_chat'
  | 'case_analysis'
  | 'ruling_analysis'
  | 'document_analysis'
  | 'precedent_comparison'
  | 'strategy'
  | 'research'
  | 'document_generation';

// --- Messages ---
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  sources?: Source[];
  modelUsed?: string;
  tokensUsed?: number;
  confidenceScore?: number;
  createdAt: string;
}

export interface Citation {
  rulingId?: string;
  chunkId?: string;
  documentId?: string;
  text: string;
  page?: number;
  url?: string;
  type: 'ruling' | 'norm' | 'doctrine';
}

export interface Source {
  id: string;
  type: 'ruling' | 'norm' | 'document';
  title: string;
  url?: string;
  snippet?: string;
}

// --- Legal Search ---
export interface SearchQuery {
  query: string;
  legalArea?: LegalArea;
  corporation?: Corporation;
  chamber?: string;
  dateFrom?: string;
  dateTo?: string;
  radicado?: string;
  magistrate?: string;
  themes?: string[];
  norms?: string[];
  keywords?: string[];
  page?: number;
  limit?: number;
}

export interface SearchResult {
  rulings: Ruling[];
  total: number;
  page: number;
  limit: number;
  processingTimeMs: number;
}

// --- Analysis ---
export interface LegalAnalysis {
  caseId: string;
  caseSummary: string;
  timeline: TimelineEvent[];
  mainLegalIssue: string;
  secondaryLegalIssues: string[];
  applicableFramework: NormReference[];
  relevantJurisprudence: RulingReference[];
  applicabilityAnalysis: string;
  argumentsFor: Argument[];
  argumentsAgainst: Argument[];
  legalRisks: Risk[];
  strengths: string[];
  weaknesses: string[];
  alternatives: LegalAlternative[];
  evaluation: string;
  recommendation: string;
  confidenceLevel: number;
  informationGaps: string[];
  createdAt: string;
}

export interface TimelineEvent {
  date: string;
  description: string;
  isJuridicallyRelevant: boolean;
  category?: string;
}

export interface NormReference {
  id?: string;
  name: string;
  article?: string;
  content?: string;
  isVigente: boolean;
}

export interface RulingReference {
  id: string;
  citation: string;
  corporation: string;
  summary: string;
  relevance: number;
  keyHolding?: string;
}

export interface Argument {
  title: string;
  description: string;
  norms?: string[];
  jurisprudence?: string[];
  strength: 'strong' | 'medium' | 'weak';
}

export interface Risk {
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface LegalAlternative {
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  viability: number;
  recommendation?: string;
}

// --- Document Generation ---
export interface DocumentGenerationRequest {
  caseId: string;
  documentType: DocumentType;
  specificInstructions?: string;
}

export type DocumentType =
  | 'concepto_juridico'
  | 'analisis_juridico'
  | 'demanda'
  | 'contestacion'
  | 'recurso'
  | 'memorial'
  | 'derecho_de_peticion'
  | 'alegatos'
  | 'argumentacion_juridica'
  | 'informe_juridico'
  | 'estudio_responsabilidad'
  | 'estudio_viabilidad'
  | 'estrategia_juridica';

export interface GeneratedDocument {
  id: string;
  caseId: string;
  userId: string;
  documentType: DocumentType;
  title: string;
  content: string;
  qualityChecks?: QualityReport;
  qualityPassed: boolean;
  docxUrl?: string;
  pdfUrl?: string;
  llmModel?: string;
  tokensUsed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface QualityReport {
  passed: boolean;
  orthographic: CheckResult;
  grammatical: CheckResult;
  punctuation: CheckResult;
  nameConsistency: CheckResult;
  dateConsistency: CheckResult;
  citationVerification: CheckResult;
  factConsistency: CheckResult;
  structureValidation: CheckResult;
}

export interface CheckResult {
  passed: boolean;
  issues: string[];
}

// --- Precedent Comparison ---
export interface PrecedentComparison {
  rulingId: string;
  rulingCitation: string;
  rulingFacts: string;
  rulingLegalIssue: string;
  rulingDecision: string;
  rulingLegalBasis: string;
  rulingNorms: string[];
  similarities: string[];
  differences: string[];
  applicability: string;
  relevanceLevel: number;
  subsequentJurisprudence: RulingReference[];
  caveat?: string;
}

// --- Jurisprudence Evolution ---
export interface EvolutionReport {
  legalTopic: string;
  corporation: string;
  currentPosition: string;
  evolutionSteps: EvolutionStep[];
  isModified: boolean;
  currentLineIsVigent: boolean;
}

export interface EvolutionStep {
  period: string;
  rulingCitation: string;
  position: string;
  changeType: 'original' | 'reitera' | 'precisa' | 'modifica' | 'supera';
}

// --- Legal Strategy ---
export interface LegalStrategy {
  whatWeHave: string;
  whatFavorsUs: string[];
  whatHurtsUs: string[];
  whatToProve: string[];
  counterarguments: string[];
  supportingJurisprudence: RulingReference[];
  adverseJurisprudence: RulingReference[];
  alternatives: LegalAlternative[];
  recommendation: string;
  alerts: CaseAlert[];
}

// --- Audit ---
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

// --- API Response ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// --- Pagination ---
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
