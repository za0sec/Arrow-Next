/**
 * Carga una imagen desde una URL y la devuelve como una promesa
 * @param {string} url - URL de la imagen a cargar
 * @returns {Promise<HTMLImageElement>} - Promesa que resuelve a un elemento de imagen HTML
 */
export const loadImage = (url) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = url;
        
        // Para imágenes de otro dominio (CORS)
        img.crossOrigin = 'Anonymous';
    });
}; 