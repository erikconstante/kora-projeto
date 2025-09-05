// controllers/productController.js

import * as productService from '../services/productService.js';
import Joi from 'joi';

// Define um "esquema" de como os dados de um produto devem se parecer.
// Isso garante que dados inválidos nunca cheguem à sua lógica de negócios ou banco de dados.
const productSchema = Joi.object({
    name: Joi.string().min(3).required().messages({
        'string.base': `"nome" deve ser do tipo texto`,
        'string.empty': `"nome" não pode estar vazio`,
        'string.min': `"nome" deve ter no mínimo {#limit} caracteres`,
        'any.required': `"nome" é um campo obrigatório`
    }),
    description: Joi.string().allow('').optional(), // Permite que a descrição seja uma string vazia ou não exista
    price: Joi.number().positive().required().messages({
        'number.base': `"preço" deve ser um número`,
        'number.positive': `"preço" deve ser um número positivo`,
        'any.required': `"preço" é um campo obrigatório`
    }),
    status: Joi.string().valid('Ativo','Inativo','Rascunho').default('Rascunho').messages({
        'any.only': '"status" inválido'
    })
});


/**
 * Controller para criar um novo produto.
 */
export const create = async (req, res) => {
    // 1. Valida o corpo da requisição usando o esquema Joi
    const { error, value } = productSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        // 2. Chama o serviço para criar o produto, passando os dados validados e o ID do usuário
        const result = await productService.createProduct(value, req.user.id);
        res.status(201).json({ message: 'Produto criado com sucesso!', productId: result.id });
    } catch (error) {
        console.error('Erro no controller ao criar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Controller para listar todos os produtos do usuário autenticado.
 */
export const getAll = async (req, res) => {
    try {
        const products = await productService.findProductsByUserId(req.user.id);
        res.status(200).json(products);
    } catch (error) {
        console.error('Erro no controller ao listar produtos:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Controller para buscar um único produto pelo ID.
 */
export const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.findProductById(id, req.user.id);

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para acessá-lo.' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Erro no controller ao buscar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Controller para atualizar um produto existente.
 */
export const update = async (req, res) => {
    // 1. Valida os dados da mesma forma que na criação
    const { error, value } = productSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: error.details[0].message });
    }

    try {
        const { id } = req.params;
        // 2. Chama o serviço para atualizar o produto
        const affectedRows = await productService.updateProductById(id, value, req.user.id);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para editá-lo.' });
        }
        res.status(200).json({ message: 'Produto atualizado com sucesso!' });
    } catch (error) {
        console.error('Erro no controller ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Controller para excluir um produto.
 */
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        const affectedRows = await productService.deleteProductById(id, req.user.id);

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.status(200).json({ message: 'Produto excluído com sucesso!' });
    } catch (error) {
        console.error('Erro no controller ao excluir produto:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};

/**
 * Controller para a rota pública de checkout.
 */
export const getPublic = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await productService.findPublicProductById(id);

        if (!product) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error('Erro no controller ao buscar produto público:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
};