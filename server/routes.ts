import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { 
  insertCreatorSchema, 
  insertTakerSchema, 
  insertTestSchema, 
  insertSubmissionSchema, 
  insertReviewRequestSchema,
  QuestionSchema,
  AnswerSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Creator routes
  app.post("/api/creators", async (req: Request, res: Response) => {
    try {
      const validatedData = insertCreatorSchema.parse(req.body);
      const creator = await storage.createCreator(validatedData);
      res.status(201).json(creator);
    } catch (error) {
      res.status(400).json({ message: "Invalid creator data" });
    }
  });

  app.get("/api/creators/:username", async (req: Request, res: Response) => {
    const { username } = req.params;
    const creator = await storage.getCreatorByUsername(username);
    
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }
    
    res.json(creator);
  });

  // Test routes
  app.post("/api/tests", async (req: Request, res: Response) => {
    try {
      const testData = {
        ...req.body,
        shareCode: nanoid(8)
      };
      
      const validatedData = insertTestSchema.parse(testData);
      const test = await storage.createTest(validatedData);
      res.status(201).json(test);
    } catch (error) {
      res.status(400).json({ message: "Invalid test data" });
    }
  });

  app.get("/api/tests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }
    
    const test = await storage.getTest(id);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    res.json(test);
  });

  app.get("/api/tests/share/:shareCode", async (req: Request, res: Response) => {
    const { shareCode } = req.params;
    const test = await storage.getTestByShareCode(shareCode);
    
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    res.json(test);
  });

  app.get("/api/creators/:creatorId/tests", async (req: Request, res: Response) => {
    const creatorId = parseInt(req.params.creatorId);
    
    if (isNaN(creatorId)) {
      return res.status(400).json({ message: "Invalid creator ID" });
    }
    
    const tests = await storage.getTestsByCreator(creatorId);
    res.json(tests);
  });

  app.put("/api/tests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }
    
    try {
      const updatedTest = await storage.updateTest(id, req.body);
      
      if (!updatedTest) {
        return res.status(404).json({ message: "Test not found" });
      }
      
      res.json(updatedTest);
    } catch (error) {
      res.status(400).json({ message: "Invalid test data" });
    }
  });

  app.delete("/api/tests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }
    
    const success = await storage.deleteTest(id);
    
    if (!success) {
      return res.status(404).json({ message: "Test not found" });
    }
    
    res.status(204).end();
  });

  // Taker routes
  app.post("/api/takers", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTakerSchema.parse(req.body);
      const taker = await storage.createTaker(validatedData);
      res.status(201).json(taker);
    } catch (error) {
      res.status(400).json({ message: "Invalid taker data" });
    }
  });

  // Submission routes
  app.post("/api/submissions", async (req: Request, res: Response) => {
    try {
      console.log("Received submission data:", JSON.stringify(req.body));
      
      // تحويل أي حقول null/undefined إلى القيم الافتراضية المناسبة
      const submissionData = {
        ...req.body,
        hasReviewRequest: req.body.hasReviewRequest ?? false,
      };
      
      const validatedData = insertSubmissionSchema.parse(submissionData);
      const submission = await storage.createSubmission(validatedData);
      res.status(201).json(submission);
    } catch (error: any) {
      console.error("Submission validation error:", error);
      res.status(400).json({ 
        message: "Invalid submission data", 
        error: error.message || String(error) 
      });
    }
  });

  app.get("/api/submissions/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }
    
    const submission = await storage.getSubmission(id);
    
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }
    
    res.json(submission);
  });

  app.get("/api/tests/:testId/submissions", async (req: Request, res: Response) => {
    const testId = parseInt(req.params.testId);
    
    if (isNaN(testId)) {
      return res.status(400).json({ message: "Invalid test ID" });
    }
    
    const submissions = await storage.getSubmissionsByTest(testId);
    res.json(submissions);
  });

  // Review Request routes
  app.post("/api/review-requests", async (req: Request, res: Response) => {
    try {
      const requestData = {
        ...req.body,
        status: "pending"
      };
      
      const validatedData = insertReviewRequestSchema.parse(requestData);
      const reviewRequest = await storage.createReviewRequest(validatedData);
      res.status(201).json(reviewRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid review request data" });
    }
  });

  app.get("/api/submissions/:submissionId/review-requests", async (req: Request, res: Response) => {
    const submissionId = parseInt(req.params.submissionId);
    
    if (isNaN(submissionId)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }
    
    const reviewRequests = await storage.getReviewRequestsBySubmission(submissionId);
    res.json(reviewRequests);
  });

  app.put("/api/review-requests/:id", async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid review request ID" });
    }
    
    try {
      const updatedRequest = await storage.updateReviewRequest(id, req.body);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Review request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(400).json({ message: "Invalid review request data" });
    }
  });

  return httpServer;
}
