import { nanoid } from "nanoid";
import { 
  Creator, InsertCreator, 
  Test, InsertTest, 
  Taker, InsertTaker, 
  Submission, InsertSubmission, 
  ReviewRequest, InsertReviewRequest,
  Question, Answer,
  User, UpsertUser
} from "@shared/schema";

export interface IStorage {
  // User operations (for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Creator operations
  createCreator(creator: InsertCreator): Promise<Creator>;
  getCreatorByUsername(username: string): Promise<Creator | undefined>;
  getCreator(id: number): Promise<Creator | undefined>;
  
  // Test operations
  createTest(test: InsertTest): Promise<Test>;
  getTest(id: number): Promise<Test | undefined>;
  getTestByShareCode(shareCode: string): Promise<Test | undefined>;
  getTestsByCreator(creatorId: number): Promise<Test[]>;
  updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined>;
  deleteTest(id: number): Promise<boolean>;
  
  // Taker operations
  createTaker(taker: InsertTaker): Promise<Taker>;
  getTaker(id: number): Promise<Taker | undefined>;
  
  // Submission operations
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmission(id: number): Promise<Submission | undefined>;
  getSubmissionsByTest(testId: number): Promise<Submission[]>;
  getSubmissionsByTaker(takerId: number): Promise<Submission[]>;
  updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined>;
  
  // Review Request operations
  createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest>;
  getReviewRequest(id: number): Promise<ReviewRequest | undefined>;
  getReviewRequestsBySubmission(submissionId: number): Promise<ReviewRequest[]>;
  updateReviewRequest(id: number, request: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined>;
}

export class MemStorage implements IStorage {
  private creators: Map<number, Creator>;
  private tests: Map<number, Test>;
  private takers: Map<number, Taker>;
  private submissions: Map<number, Submission>;
  private reviewRequests: Map<number, ReviewRequest>;
  
  private creatorId: number;
  private testId: number;
  private takerId: number;
  private submissionId: number;
  private reviewRequestId: number;
  
  constructor() {
    this.creators = new Map();
    this.tests = new Map();
    this.takers = new Map();
    this.submissions = new Map();
    this.reviewRequests = new Map();
    
    this.creatorId = 1;
    this.testId = 1;
    this.takerId = 1;
    this.submissionId = 1;
    this.reviewRequestId = 1;
    
    // إنشاء مستخدم افتراضي لتسهيل الاختبار
    this.initializeDefaultCreator();
  }
  
  // تهيئة مستخدم افتراضي
  private async initializeDefaultCreator() {
    try {
      const defaultCreator = {
        username: "default_creator",
        name: "منشئ الاختبارات"
      };
      const creator = await this.createCreator(defaultCreator);
      console.log("تم إنشاء المستخدم الافتراضي:", creator.id);
    } catch (error) {
      console.error("خطأ في إنشاء المستخدم الافتراضي:", error);
    }
  }
  
  // Creator operations
  async createCreator(creator: InsertCreator): Promise<Creator> {
    const id = this.creatorId++;
    const newCreator = { ...creator, id };
    this.creators.set(id, newCreator);
    return newCreator;
  }
  
  async getCreatorByUsername(username: string): Promise<Creator | undefined> {
    return Array.from(this.creators.values()).find(
      (creator) => creator.username === username,
    );
  }
  
  async getCreator(id: number): Promise<Creator | undefined> {
    return this.creators.get(id);
  }
  
  // Test operations
  async createTest(test: InsertTest): Promise<Test> {
    const id = this.testId++;
    const now = new Date();
    // التأكد من وجود حقل description كـ null إذا لم يكن موجوداً
    const newTest = { 
      ...test, 
      id, 
      createdAt: now,
      description: test.description ?? null 
    };
    this.tests.set(id, newTest);
    return newTest;
  }
  
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async getTestByShareCode(shareCode: string): Promise<Test | undefined> {
    return Array.from(this.tests.values()).find(
      (test) => test.shareCode === shareCode,
    );
  }
  
  async getTestsByCreator(creatorId: number): Promise<Test[]> {
    return Array.from(this.tests.values()).filter(
      (test) => test.creatorId === creatorId,
    );
  }
  
  async updateTest(id: number, test: Partial<InsertTest>): Promise<Test | undefined> {
    const existingTest = this.tests.get(id);
    if (!existingTest) return undefined;
    
    const updatedTest = { ...existingTest, ...test };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }
  
  async deleteTest(id: number): Promise<boolean> {
    return this.tests.delete(id);
  }
  
  // Taker operations
  async createTaker(taker: InsertTaker): Promise<Taker> {
    const id = this.takerId++;
    const newTaker = { ...taker, id };
    this.takers.set(id, newTaker);
    return newTaker;
  }
  
  async getTaker(id: number): Promise<Taker | undefined> {
    return this.takers.get(id);
  }
  
  // Submission operations
  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const id = this.submissionId++;
    // ضمان وجود قيمة لحقل hasReviewRequest
    const newSubmission = { 
      ...submission, 
      id,
      hasReviewRequest: submission.hasReviewRequest ?? false
    };
    this.submissions.set(id, newSubmission);
    return newSubmission;
  }
  
  async getSubmission(id: number): Promise<Submission | undefined> {
    return this.submissions.get(id);
  }
  
  async getSubmissionsByTest(testId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.testId === testId,
    );
  }
  
  async getSubmissionsByTaker(takerId: number): Promise<Submission[]> {
    return Array.from(this.submissions.values()).filter(
      (submission) => submission.takerId === takerId,
    );
  }
  
  async updateSubmission(id: number, submission: Partial<InsertSubmission>): Promise<Submission | undefined> {
    const existingSubmission = this.submissions.get(id);
    if (!existingSubmission) return undefined;
    
    const updatedSubmission = { ...existingSubmission, ...submission };
    this.submissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  // Review Request operations
  async createReviewRequest(request: InsertReviewRequest): Promise<ReviewRequest> {
    const id = this.reviewRequestId++;
    const now = new Date();
    // ضمان تعبئة الحقول المطلوبة
    const newRequest = { 
      ...request, 
      id, 
      createdAt: now,
      requestMessage: request.requestMessage ?? null
    };
    this.reviewRequests.set(id, newRequest);
    
    // Update the submission to indicate it has a review request
    const submission = await this.getSubmission(request.submissionId);
    if (submission) {
      await this.updateSubmission(submission.id, { hasReviewRequest: true });
    }
    
    return newRequest;
  }
  
  async getReviewRequest(id: number): Promise<ReviewRequest | undefined> {
    return this.reviewRequests.get(id);
  }
  
  async getReviewRequestsBySubmission(submissionId: number): Promise<ReviewRequest[]> {
    return Array.from(this.reviewRequests.values()).filter(
      (request) => request.submissionId === submissionId,
    );
  }
  
  async updateReviewRequest(id: number, request: Partial<InsertReviewRequest>): Promise<ReviewRequest | undefined> {
    const existingRequest = this.reviewRequests.get(id);
    if (!existingRequest) return undefined;
    
    const updatedRequest = { ...existingRequest, ...request };
    this.reviewRequests.set(id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MemStorage();
