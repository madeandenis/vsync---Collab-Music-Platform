const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        graphite: '#282828',
        charcoalBlack: '#101010',
        spotifyGreen: '#1DB954',
        ytMusicRed: '#ff0033',
        ytMusicBlack: '#020202',
      },
      fontFamily: {
        roboto: ['Roboto', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        nunito: ['Nunito', 'sans-serif'], 
      },
      boxShadow: {
        'hover-black': '0 10px 30px rgba(0, 0, 0, 0.7)', 
      },
    },
  },
  plugins: [],
};
