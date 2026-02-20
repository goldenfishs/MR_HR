import { Request, Response } from 'express';
import LearningResourceModel from '../models/LearningResource.model';

class ResourceController {
  async getAllResources(req: Request, res: Response): Promise<void> {
    try {
      const {
        type,
        category,
        page = '1',
        pageSize = '10',
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      const resources = await LearningResourceModel.findAll({
        type: type as any,
        category: category as string,
        limit: pageSizeNum,
        offset,
      });

      const total = await LearningResourceModel.count({
        type: type as any,
        category: category as string,
      });

      res.status(200).json({
        success: true,
        data: {
          items: resources,
          total,
          page: pageNum,
          pageSize: pageSizeNum,
          totalPages: Math.ceil(total / pageSizeNum),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resources',
      });
    }
  }

  async getResourceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const resource = await LearningResourceModel.findById(parseInt(id));

      if (!resource) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch resource',
      });
    }
  }

  async getResourceCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await LearningResourceModel.getCategories();

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

  async createResource(req: Request, res: Response): Promise<void> {
    try {
      const { title, description, url, type, category } = req.body;

      const resource = await LearningResourceModel.create({
        title,
        description,
        url,
        type,
        category,
      });

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource created successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create resource',
      });
    }
  }

  async updateResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, description, url, type, category } = req.body;

      const updated = await LearningResourceModel.update(parseInt(id), {
        title,
        description,
        url,
        type,
        category,
      });

      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      }

      const resource = await LearningResourceModel.findById(parseInt(id));

      res.status(200).json({
        success: true,
        data: resource,
        message: 'Resource updated successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update resource',
      });
    }
  }

  async deleteResource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await LearningResourceModel.delete(parseInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Resource not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Resource deleted successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete resource',
      });
    }
  }
}

export default new ResourceController();
