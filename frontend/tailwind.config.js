/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Colores principales
        primary: '#0056a0',     // Azul corporativo
        secondary: '#d92c3a',   // Rojo corporativo
        background: '#F7F9FB',  // Gris muy claro
        
        // Colores personalizados para consistencia
        'pretensa-blue': '#0056a0',
        'pretensa-red': '#d92c3a',
        'pretensa-gray': '#F7F9FB',
      },
      backgroundImage: {
        'pretensa-gradient': `
          radial-gradient(at 0% 0%, #0056a01a 0px, transparent 50%),
          radial-gradient(at 100% 100%, #d92c3a1a 0px, transparent 50%)
        `,
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
}