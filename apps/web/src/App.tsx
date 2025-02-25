import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Menu, X, Github } from 'lucide-react';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 },
  { name: 'Mar', value: 600 },
  { name: 'Apr', value: 800 },
  { name: 'May', value: 500 },
  { name: 'Jun', value: 900 },
];

function App() {
  const [count, setCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold"
        >
          Blink App
        </motion.h1>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold mb-8 text-center">
            Modern Full-Stack Development
          </h2>
          
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-12">
            <h3 className="text-2xl font-semibold mb-4">Tech Stack Overview</h3>
            <p className="mb-6 text-gray-300">
              We've selected a <strong>Vite + Hono + React Native</strong> monorepo architecture 
              optimized for serverless deployment, development speed, and code sharing.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: 'Turborepo', desc: 'Monorepo management with intelligent build caching' },
                { title: 'Vite', desc: 'Frontend tooling with best-in-class HMR and error reporting' },
                { title: 'Hono', desc: 'Ultralight, TypeScript-first backend framework designed for serverless' },
                { title: 'React Native', desc: 'Mobile app development sharing code with web' },
                { title: 'Firebase', desc: 'Authentication, Firestore, Cloud Storage, and deployment target' },
                { title: 'TypeScript', desc: 'Type safety across the entire stack' }
              ].map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + (i * 0.1) }}
                  className="bg-gray-700 p-4 rounded-lg"
                >
                  <h4 className="font-bold mb-2">{item.title}</h4>
                  <p className="text-sm text-gray-300">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-12">
            <h3 className="text-2xl font-semibold mb-6">Interactive Demo</h3>
            <div className="flex flex-col items-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mb-8"
              >
                <button
                  onClick={() => setCount((count) => count + 1)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 rounded-lg font-medium transition-colors"
                >
                  Count is {count}
                </button>
              </motion.div>
              
              <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#aaa" />
                    <YAxis stroke="#aaa" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#333', border: 'none' }}
                    />
                    <Bar dataKey="value" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* New Tailwind CSS Demo Section */}
          <div className="bg-gray-800 p-8 rounded-xl shadow-lg mb-12">
            <h3 className="text-2xl font-semibold mb-6">Tailwind CSS Color Palette</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                <div key={shade} className="flex flex-col items-center">
                  <div 
                    className={`w-16 h-16 rounded-lg bg-primary-${shade} mb-2`}
                    style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                  ></div>
                  <span className="text-xs text-gray-300">{shade}</span>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <h4 className="text-lg font-semibold mb-4">Typography with Custom Font</h4>
              <div className="space-y-4">
                <p className="text-4xl font-bold">Heading 1</p>
                <p className="text-3xl font-bold">Heading 2</p>
                <p className="text-2xl font-bold">Heading 3</p>
                <p className="text-xl font-semibold">Heading 4</p>
                <p className="text-lg">Regular paragraph text</p>
                <p className="text-sm text-gray-300">Small text with muted color</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 mb-4 md:mb-0">
            © 2023 Blink App
          </p>
          <div className="flex space-x-4">
            <a href="https://github.com" className="text-gray-400 hover:text-white">
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App; 