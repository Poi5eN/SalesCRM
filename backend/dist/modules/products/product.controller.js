import { ProductService } from './product.service.js';
import { success } from '../../utils/response.js';
export class ProductController {
    static list = async (req, res) => {
        const result = await ProductService.listProducts(req.user.tenantId, req.query);
        return success(res, result, 'Products fetched successfully');
    };
    static create = async (req, res) => {
        const product = await ProductService.createProduct(req.user.tenantId, req.body);
        return success(res, product, 'Product created successfully', 201);
    };
    static get = async (req, res) => {
        const product = await ProductService.getProduct(req.user.tenantId, req.params.id);
        return success(res, product, 'Product details fetched successfully');
    };
    static update = async (req, res) => {
        const product = await ProductService.updateProduct(req.user.tenantId, req.params.id, req.body);
        return success(res, product, 'Product updated successfully');
    };
    static delete = async (req, res) => {
        await ProductService.deleteProduct(req.user.tenantId, req.params.id);
        return success(res, null, 'Product deleted successfully');
    };
}
