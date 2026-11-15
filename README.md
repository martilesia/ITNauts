# ITNauts

## Getting Started

Follow these instructions to clone, install, and run the application locally.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- Git

### Installation

1. Clone the repository:

   ```bash
   git clone git@github.com:martilesia/ITNauts.git
   ```

2. Navigate to the project directory:

   ```bash
   cd ITNauts
   ```

3. Install the compatible esbuild version to resolve the Vite dependency conflict:

   ```bash
   npm install -D esbuild@^0.28.0
   ```

4. Install the project dependencies:

   ```bash
   npm install
   ```

### Running the Application

This project is built with **React and Vite**.

Start the development server on port **3000**:

```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

Access the application at:

```text
http://localhost:3000
```

### Building for Production

Generate an optimized production build:

```bash
npm run build
```

The generated production files will be available in the `dist/` directory.

### Previewing the Production Build

To preview the production build on port 3000:

```bash
npm run preview -- --host 0.0.0.0 --port 3000
```
