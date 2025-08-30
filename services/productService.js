// services/productService.js
import pool from '../config/database.js';

export const createProduct = async (productData, userId) => {
    const { name, description, price } = productData;
    const sql = "INSERT INTO products (user_id, name, description, price) VALUES (?, ?, ?, ?)";
    const [result] = await pool.query(sql, [userId, name, description, price]);
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
    const { name, description, price } = productData;
    const sql = "UPDATE products SET name = ?, description = ?, price = ? WHERE id = ? AND user_id = ?";
    const [result] = await pool.query(sql, [name, description, price, productId, userId]);
    return result.affectedRows;
};

export const deleteProductById = async (productId, userId) => {
    const sql = "DELETE FROM products WHERE id = ? AND user_id = ?";
    const [result] = await pool.query(sql, [productId, userId]);
    return result.affectedRows;
};

export const findPublicProductById = async (productId) => {
    const sql = "SELECT name, description, price FROM products WHERE id = ?";
    const [products] = await pool.query(sql, [productId]);
    return products[0];
};