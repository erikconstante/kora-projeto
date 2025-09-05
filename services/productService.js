// services/productService.js
import pool from '../config/database.js';

export const createProduct = async (productData, userId) => {
    const { name, description, price, status } = productData;
    const sql = "INSERT INTO products (user_id, name, description, price, status) VALUES (?, ?, ?, ?, ?)";
    const [result] = await pool.query(sql, [userId, name, description, price, status || 'Rascunho']);
    return { id: result.insertId };
};

export const findProductsByUserId = async (userId) => {
    const sql = "SELECT * FROM products WHERE user_id = ?";
    const [products] = await pool.query(sql, [userId]);
    return products;
};

export const findProductById = async (productId, userId) => {
    const sql = "SELECT * FROM products WHERE id = ? AND user_id = ?";
    const [products] = await pool.query(sql, [productId, userId]);
    return products[0];
};

export const updateProductById = async (productId, productData, userId) => {
    const { name, description, price, status } = productData;
    const sql = "UPDATE products SET name = ?, description = ?, price = ?, status = ? WHERE id = ? AND user_id = ?";
    const [result] = await pool.query(sql, [name, description, price, status, productId, userId]);
    return result.affectedRows;
};

export const deleteProductById = async (productId, userId) => {
    const sql = "DELETE FROM products WHERE id = ? AND user_id = ?";
    const [result] = await pool.query(sql, [productId, userId]);
    return result.affectedRows;
};

export const findPublicProductById = async (productId) => {
    // Somente produtos com status 'Ativo' ficam públicos
    const sql = "SELECT name, description, price FROM products WHERE id = ? AND status = 'Ativo'";
    const [products] = await pool.query(sql, [productId]);
    return products[0];
};