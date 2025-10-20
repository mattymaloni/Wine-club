import React, { useState, useEffect, useCallback } from 'react';
import { Camera, Wine, BookOpen, Upload, X, LogOut } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase credentials
const supabaseUrl = 'https://oieuxjexqntyekhdzmlj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZXV4amV4cW50eWVraGR6bWxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NjUxMjAsImV4cCI6MjA3NjQ0MTEyMH0.ddqdlHM9Seoz4Ocvl47a9PMgpUV5DyJ-w3ix-RRLNqA';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const WineClubApp = () => {
  const [view, setView] = useState('home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [wineResult, setWineResult] = useState(null);
  const [myCollection, setMyCollection] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadUserCollection(session.user.id);
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserCollection(session.user.id);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const loadUserCollection = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('*')
        .eq('user_id', userId)
        .order('date_added', { ascending: false });

      if (error) throw error;
      setMyCollection(data || []);
    } catch (error) {
      console.error('Error loading collection:', error);
    }
  };

  const handleSignUp = useCallback(async () => {
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) throw error;
      
      alert('Account created! You can now sign in.');
      setIsSignUp(false);
    } catch (error) {
      setAuthError(error.message);
    }
  }, [email, password, name]);

  const handleSignIn = useCallback(async () => {
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      setView('home');
    } catch (error) {
      setAuthError(error.message);
    }
  }, [email, password]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyCollection([]);
    setView('auth');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
      analyzeWine(file);
    }
  };

  const analyzeWine = async (file) => {
    setAnalyzing(true);
    setView('result');
    
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('https://pastry-art-wine-club.onrender.com/analyze-wine', {
        method: 'POST',
        body: formData,
      });
      
      const aiResult = await response.json();
      
      const { data: franksNote } = await supabase
        .from('franks_notes')
        .select('*')
        .ilike('wine_name', `%${aiResult.name}%`)
        .single();
      
      const finalResult = {
        name: aiResult.name,
        varietal: aiResult.varietal || 'Unknown',
        region: aiResult.region || 'Unknown',
        vintage: aiResult.vintage || 'N/A',
        notes: franksNote 
          ? franksNote.notes 
          : `AI Notes: ${aiResult.notes || 'No additional notes available.'}\n\nFrank says: "I haven't tasted this one yet! Bring a bottle to the next meeting."`,
        rating: franksNote ? franksNote.rating : 'TBD'
      };
      
      setWineResult(finalResult);
      setAnalyzing(false);
      
    } catch (error) {
      console.error('Error analyzing wine:', error);
      setWineResult({
        name: 'Error analyzing wine',
        varietal: 'Unknown',
        region: 'Unknown',
        notes: 'There was an error connecting to the AI service. Please try again.',
        rating: 'N/A'
      });
      setAnalyzing(false);
    }
  };

  const addToCollection = async () => {
    if (!wineResult || !user) return;
    
    try {
      const { error } = await supabase
        .from('user_collections')
        .insert([
          {
            user_id: user.id,
            wine_name: wineResult.name,
            varietal: wineResult.varietal,
            region: wineResult.region,
            vintage: wineResult.vintage,
            personal_notes: ''
          }
        ])
        .select();

      if (error) throw error;
      
      await loadUserCollection(user.id);
      alert('Wine added to your collection!');
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('Error adding wine to collection');
    }
  };

  const removeFromCollection = async (wineId) => {
    try {
      const { error } = await supabase
        .from('user_collections')
        .delete()
        .eq('id', wineId);

      if (error) throw error;
      
      await loadUserCollection(user.id);
    } catch (error) {
      console.error('Error removing wine:', error);
    }
  };

  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8 pt-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome!</h1>
            <p className="text-red-200 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-red-700 px-4 py-2 rounded-lg hover:bg-red-600 transition flex items-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>

        <div className="text-center mb-8">
          <Wine className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">Wine Club</h2>
          <p className="text-red-200">Featuring Frank's Expert Notes</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <div className="bg-white text-red-900 rounded-lg p-6 text-center cursor-pointer hover:bg-red-50 transition">
              <Camera className="w-12 h-12 mx-auto mb-3" />
              <span className="text-lg font-semibold">Take Photo</span>
              <p className="text-sm text-red-700 mt-1">Snap a picture of your wine</p>
            </div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <label className="block">
            <div className="bg-white text-red-900 rounded-lg p-6 text-center cursor-pointer hover:bg-red-50 transition">
              <Upload className="w-12 h-12 mx-auto mb-3" />
              <span className="text-lg font-semibold">Upload Photo</span>
              <p className="text-sm text-red-700 mt-1">Choose from your gallery</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setView('collection')}
            className="w-full bg-red-700 text-white rounded-lg p-6 text-center hover:bg-red-600 transition"
          >
            <BookOpen className="w-12 h-12 mx-auto mb-3" />
            <span className="text-lg font-semibold">My Collection</span>
            <p className="text-sm text-red-200 mt-1">{myCollection.length} wines saved</p>
          </button>
        </div>
      </div>
    </div>
  );

  const ResultView = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setView('home')}
          className="mb-4 text-red-200 hover:text-white flex items-center"
        >
          <X className="w-5 h-5 mr-1" /> Back
        </button>

        {uploadedImage && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img src={uploadedImage} alt="Wine bottle" className="w-full h-64 object-cover" />
          </div>
        )}

        {analyzing ? (
          <div className="bg-white text-red-900 rounded-lg p-8 text-center">
            <Wine className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-semibold">Analyzing your wine...</p>
            <p className="text-sm text-red-700 mt-2">Consulting Frank's notes</p>
          </div>
        ) : wineResult ? (
          <div className="bg-white text-red-900 rounded-lg p-6 space-y-4">
            <h2 className="text-2xl font-bold">{wineResult.name}</h2>
            
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Varietal:</span> {wineResult.varietal}
              </div>
              <div>
                <span className="font-semibold">Region:</span> {wineResult.region}
              </div>
              <div>
                <span className="font-semibold">Vintage:</span> {wineResult.vintage}
              </div>
              <div>
                <span className="font-semibold">Frank's Rating:</span> {wineResult.rating}
              </div>
            </div>

            <div className="bg-red-50 border-l-4 border-red-700 p-4 rounded">
              <p className="text-sm font-semibold text-red-900 mb-2 flex items-center">
                <Wine className="w-4 h-4 mr-2" />
                Frank's Notes
              </p>
              <p className="text-sm text-red-800">{wineResult.notes}</p>
            </div>

            <button
              onClick={addToCollection}
              className="w-full bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
            >
              Add to My Collection
            </button>

            <button
              onClick={() => {
                setUploadedImage(null);
                setWineResult(null);
                setView('home');
              }}
              className="w-full bg-red-100 text-red-900 py-3 rounded-lg font-semibold hover:bg-red-200 transition"
            >
              Scan Another Wine
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );

  const CollectionView = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <button
          onClick={() => setView('home')}
          className="mb-4 text-red-200 hover:text-white flex items-center"
        >
          <X className="w-5 h-5 mr-1" /> Back
        </button>

        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <BookOpen className="w-8 h-8 mr-3" />
          My Wine Collection
        </h2>

        {myCollection.length === 0 ? (
          <div className="bg-white text-red-900 rounded-lg p-8 text-center">
            <Wine className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No wines yet</p>
            <p className="text-sm text-red-700">Start scanning wines to build your collection!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myCollection.map((wine) => (
              <div key={wine.id} className="bg-white text-red-900 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{wine.wine_name}</h3>
                  <button
                    onClick={() => removeFromCollection(wine.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-red-700 mb-1">{wine.varietal} • {wine.region}</p>
                {wine.vintage && wine.vintage !== 'N/A' && (
                  <p className="text-sm text-red-600">Vintage: {wine.vintage}</p>
                )}
                <p className="text-sm text-red-600">Added: {new Date(wine.date_added).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white flex items-center justify-center">
        <Wine className="w-16 h-16 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6 flex items-center justify-center">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <Wine className="w-16 h-16 mx-auto mb-4" />
              <h1 className="text-3xl font-bold mb-2">Wine Club</h1>
              <p className="text-red-200">Sign in to access your collection</p>
            </div>

            <div className="bg-white text-red-900 rounded-lg p-6">
              <div className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 border border-red-200 rounded-lg"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-3 border border-red-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 border border-red-200 rounded-lg"
                  />
                </div>

                {authError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {authError}
                  </div>
                )}

                <button
                  onClick={isSignUp ? handleSignUp : handleSignIn}
                  className="w-full bg-red-700 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
                >
                  {isSignUp ? 'Sign Up' : 'Sign In'}
                </button>

                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setAuthError('');
                  }}
                  className="w-full text-red-700 text-sm hover:underline"
                >
                  {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {view === 'home' && <HomeView />}
          {view === 'result' && <ResultView />}
          {view === 'collection' && <CollectionView />}
        </>
      )}
    </>
  );
};

export default WineClubApp;