import { Request, Response } from 'express';
import QuestionBankModel from '../models/QuestionBank.model';

class QuestionController {
  async getAllQuestions(req: Request, res: Response): Promise<void> {
    try {
      const {
        category,
        difficulty,
        search,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      let questions;

      if (search) {
        questions = await QuestionBankModel.search(search as string, {
          category: category as any,
          difficulty: difficulty as any,
          limit: pageSizeNum,
          offset,
        });
      } else {
        questions = await QuestionBankModel.findAll({
          category: category as string,
          difficulty: difficulty as any,
          limit: pageSizeNum,
          offset,
        });
      }

      const total = await QuestionBankModel.count(category as string);

      res.status(200).json({
        success: true,
        data: {
          items: questions,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch questions',
      });
    }
  }

  async getQuestionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const question = await QuestionBankModel.findById(parseInt(id));

      if (!question) {
        res.status(404).json({
          success: false,
          error: 'Question not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: question,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch question',
      });
    }
  }

  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await QuestionBankModel.getCategories();

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
      });
    }
  }

  async getRandomQuestions(req: Request, res: Response): Promise<void> {
    try {
      const { count = '5', category } = req.query;

      const questions = await QuestionBankModel.getRandom(
        parseInt(count as string),
        category as string
      );

      res.status(200).json({
        success: true,
        data: questions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch random questions',
      });
    }
  }

  async createQuestion(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const { category, question, answer, difficulty, tags } = req.body;

      const newQuestion = await QuestionBankModel.create({
        category,
        question,
        answer,
        difficulty,
        tags: tags ? JSON.stringify(tags) : undefined,
        created_by: userId,
      });

      res.status(201).json({
        success: true,
        data: newQuestion,
        message: 'Question created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create question',
      });
    }
  }

  async updateQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { category, question, answer, difficulty, tags } = req.body;

      const updated = await QuestionBankModel.update(parseInt(id), {
        category,
        question,
        answer,
        difficulty,
        tags: tags ? JSON.stringify(tags) : undefined,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Question not found',
        });
        return;
      }

      const updatedQuestion = await QuestionBankModel.findById(parseInt(id));

      res.status(200).json({
        success: true,
        data: updatedQuestion,
        message: 'Question updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update question',
      });
    }
  }

  async deleteQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await QuestionBankModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Question not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete question',
      });
    }
  }
}

export default new QuestionController();
