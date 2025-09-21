import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import InputField from './components/InputField';
import SelectField from './components/SelectField';
import Button from './components/Button';
import Loader from './components/Loader';
import ArticleOutput from './components/ArticleOutput';
import HistoryPage from './components/History';
import Footer from './components/Footer';
import AboutPage from './components/AboutPage';
import ContactPage from './components/ContactPage';
import DisclaimerPage from './components/DisclaimerPage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import TermsPage from './components/TermsPage';
import { generateBlogArticle } from './services/geminiService';
import type { WordCount, Language, Tone, Article, View } from './types';
import { WORD_COUNT_OPTIONS, LANGUAGE_OPTIONS, TONE_OPTIONS } from './constants';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [wordCount, setWordCount] = useState<WordCount>('500');
  const [language, setLanguage] = useState<Language>('English');
  const [tone, setTone] = useState<Tone>('Professional');
  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Article[]>([]);
  const [view, setView] = useState<View>('main');

  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('blogArticleHistory');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('blogArticleHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, [history]);

  const handleGenerateArticle = useCallback(async () => {
    if (!topic.trim()) {
      setError('Please enter a blog topic or keyword.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedArticle(null);

    try {
      const articleData = await generateBlogArticle(topic, wordCount, language, tone);
      const newArticle: Article = {
          ...articleData,
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
      };
      setGeneratedArticle(newArticle);
      setHistory(prevHistory => [newArticle, ...prevHistory.slice(0, 49)]); // Keep history to 50 items
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'An unexpected error occurred.';
      setError(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [topic, wordCount, language, tone]);
  
  const handleSelectFromHistory = useCallback((article: Article) => {
    setGeneratedArticle(article);
    setView('main');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleDeleteFromHistory = useCallback((id: string) => {
      setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleClearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all generation history? This action cannot be undone.")) {
      setHistory([]);
      if (view === 'history') {
        // do nothing, stay on empty history page
      } else {
        setGeneratedArticle(null);
      }
    }
  }, [view]);

  const navigate = (newView: View) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (view) {
      case 'history':
        return (
          <HistoryPage
            history={history}
            onSelectArticle={handleSelectFromHistory}
            onClearHistory={handleClearHistory}
            onDeleteArticle={handleDeleteFromHistory}
            onShowMain={() => navigate('main')}
          />
        );
      case 'about':
        return <AboutPage onShowMain={() => navigate('main')} />;
      case 'contact':
        return <ContactPage onShowMain={() => navigate('main')} />;
      case 'disclaimer':
        return <DisclaimerPage onShowMain={() => navigate('main')} />;
      case 'privacy':
        return <PrivacyPolicyPage onShowMain={() => navigate('main')} />;
      case 'terms':
        return <TermsPage onShowMain={() => navigate('main')} />;
      case 'main':
      default:
        return (
          <>
            <main className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl p-6 md:p-8">
              <div className="space-y-6">
                <InputField
                  id="topic"
                  label="Blog Topic / Keyword"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., 'Future of Digital Marketing in India'"
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SelectField
                    id="wordCount"
                    label="Word Count"
                    value={wordCount}
                    onChange={(e) => setWordCount(e.target.value as WordCount)}
                    options={WORD_COUNT_OPTIONS}
                  />
                  <SelectField
                    id="language"
                    label="Language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    options={LANGUAGE_OPTIONS}
                  />
                  <SelectField
                    id="tone"
                    label="Tone"
                    value={tone}
                    onChange={(e) => setTone(e.target.value as Tone)}
                    options={TONE_OPTIONS}
                  />
                </div>
                <Button onClick={handleGenerateArticle} disabled={isLoading}>
                  {isLoading ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                    </>
                  ) : '✨ Generate Article'}
                </Button>
              </div>
            </main>
            
            {error && (
                <div className="mt-8 w-full bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
                    {error}
                </div>
            )}

            <div className="mt-8 w-full">
                {isLoading && <Loader />}
                {generatedArticle && <ArticleOutput article={generatedArticle} />}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-3xl mx-auto flex flex-col flex-grow">
        <Header onShowHistory={() => navigate('history')} onShowMain={() => navigate('main')} />
        <main className="flex-grow">
          {renderContent()}
        </main>
      </div>
       <Footer onNavigate={navigate} />
    </div>
  );
};

export default App;
