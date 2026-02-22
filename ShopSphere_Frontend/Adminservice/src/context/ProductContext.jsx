import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { fetchAllProducts } from '../api/axios';

const ProductContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchAllProducts();
            // API returns a paginated envelope: { count, num_pages, current_page, results }
            const products = Array.isArray(data) ? data : (data?.results ?? []);
            setProducts(products);
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const updateProductStatus = useCallback((productId, newStatus) => {
        // Optimistic update
        setProducts(prev => prev.map(p =>
            p.id === productId ? { ...p, status: newStatus } : p
        ));
    }, []);

    const value = useMemo(() => ({
        products,
        isLoading,
        updateProductStatus,
        refreshProducts: loadProducts
    }), [products, isLoading, updateProductStatus, loadProducts]);

    return (
        <ProductContext.Provider value={value}>
            {children}
        </ProductContext.Provider>
    );
};
