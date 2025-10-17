import React, { useState } from 'react';
import { Camera, Wine, BookOpen, Home, Upload, X } from 'lucide-react';

const WineClubApp = () => {
  const [view, setView] = useState('home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [wineResult, setWineResult] = useState(null);
  const [myCollection, setMyCollection] = useState([]);

  // Sample Frank's notes database
  const franksNotes = {
    'caymus': {
      name: 'Caymus Cabernet Sauvignon',
      varietal: 'Cabernet Sauvignon',
      region: 'Napa Valley, California',
      notes: 'Rich and bold with dark fruit flavors. Frank says: "This is a crowd-pleaser! Pair it with a good ribeye. The 2019 vintage is drinking beautifully right now."',
      rating: '4.5/5'
    },
    'opus one': {
      name: 'Opus One',
      varietal: 'Bordeaux Blend',
      region: 'Napa Valley, California',
      notes: 'Elegant and structured with layers of complexity. Frank says: "Worth every penny. Decant for at least an hour. This is special occasion wine that will age gracefully for another decade."',
      rating: '5/5'
    },
    'silver oak': {
      name: 'Silver Oak Cabernet Sauvignon',
      varietal: 'Cabernet Sauvignon',
      region: 'Napa Valley, California',
      notes: 'Smooth with notes of vanilla and coconut from American oak. Frank says: "Great for newcomers to Napa Cab. The Alexander Valley version offers excellent value."',
      rating: '4/5'
    },
    'stags leap': {
      name: "Stag's Leap Wine Cellars",
      varietal: 'Cabernet Sauvignon',
      region: 'Napa Valley, California',
      notes: 'Refined tannins with blackberry and cassis. Frank says: "The Fay Vineyard is legendary. This beat French wines in the Judgment of Paris!"',
      rating: '4.5/5'
    },
    'default': {
      name: 'Wine Identified',
      varietal: 'Various',
      region: 'Various',
      notes: 'Frank says: "I haven\'t tasted this one yet, but I\'d love to add it to my notes! Bring a bottle to the next meeting."',
      rating: 'TBD'
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
        analyzeWine(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeWine = (filename) => {
    setAnalyzing(true);
    setView('result');
    
    // Simulate AI analysis
    setTimeout(() => {
      const searchTerm = filename.toLowerCase();
      let wine = franksNotes['default'];
      
      // Simple matching logic
      for (let key in franksNotes) {
        if (searchTerm.includes(key)) {
          wine = franksNotes[key];
          break;
        }
      }
      
      setWineResult(wine);
      setAnalyzing(false);
    }, 2000);
  };

  const addToCollection = () => {
    if (wineResult && !myCollection.find(w => w.name === wineResult.name)) {
      setMyCollection([...myCollection, { ...wineResult, dateAdded: new Date().toLocaleDateString() }]);
    }
  };

  const removeFromCollection = (wineName) => {
    setMyCollection(myCollection.filter(w => w.name !== wineName));
  };

  const HomeView = () => (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900 text-white p-6">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
          <Wine className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Wine Club</h1>
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
            {myCollection.map((wine, idx) => (
              <div key={idx} className="bg-white text-red-900 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{wine.name}</h3>
                  <button
                    onClick={() => removeFromCollection(wine.name)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-sm text-red-700 mb-1">{wine.varietal} • {wine.region}</p>
                <p className="text-sm text-red-600">Added: {wine.dateAdded}</p>
                <p className="text-sm text-red-700 mt-2 italic">Rating: {wine.rating}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {view === 'home' && <HomeView />}
      {view === 'result' && <ResultView />}
      {view === 'collection' && <CollectionView />}
    </>
  );
};

export default WineClubApp;