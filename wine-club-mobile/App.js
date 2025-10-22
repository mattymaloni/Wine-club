import React, { useState, useEffect } from 'react';
import Svg, { Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { Dimensions } from 'react-native';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabaseClient';

// Component to render rating dots - MUST be outside App component
const RatingDots = ({ rating, maxRating = 5 }) => {
  return (
    <View style={styles.ratingDotsContainer}>
      {[...Array(maxRating)].map((_, index) => (
        <View
          key={index}
          style={[
            styles.ratingDot,
            index < rating ? styles.ratingDotFilled : styles.ratingDotEmpty
          ]}
        />
      ))}
    </View>
  );
};

// Custom Radar Chart Component using SVG
const CustomRadarChart = ({ data, size = 250 }) => {
  const labels = ['Potency', 'Acidity', 'Sweetness', 'Tannins', 'Fruitiness'];
  const values = [data.potency, data.acidity, data.sweetness, data.tannins, data.fruitiness];
  
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = size * 0.32;
  
  // Calculate pentagon vertices for a given radius
  const getPentagonPoints = (radius) => {
    return labels.map((_, index) => {
      const angle = (index * 72 - 90) * (Math.PI / 180);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };
  
  // Calculate data polygon points
  const getDataPoints = () => {
    return values.map((value, index) => {
      const angle = (index * 72 - 90) * (Math.PI / 180);
      const radius = (value / 5) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return `${x},${y}`;
    }).join(' ');
  };
  
  // Calculate label positions
  const getLabelPosition = (index) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const distance = maxRadius * 1.15;
    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);
    return { x, y };
  };
  
  // Calculate vertex positions for circles
  const getVertexPositions = () => {
    return values.map((value, index) => {
      const angle = (index * 72 - 90) * (Math.PI / 180);
      const radius = (value / 5) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      return { x, y };
    });
  };
  
  const vertexPositions = getVertexPositions();
  
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {/* Grid pentagons */}
        {[1, 2, 3, 4, 5].map((level) => {
          const radius = (level / 5) * maxRadius;
          return (
            <Polygon
              key={level}
              points={getPentagonPoints(radius)}
              fill="none"
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Radial lines */}
        {labels.map((_, index) => {
          const angle = (index * 72 - 90) * (Math.PI / 180);
          const endX = centerX + maxRadius * Math.cos(angle);
          const endY = centerY + maxRadius * Math.sin(angle);
          return (
            <Line
              key={index}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke="rgba(255, 255, 255, 0.3)"
              strokeWidth="1"
            />
          );
        })}
        
        {/* Data polygon - filled */}
        <Polygon
          points={getDataPoints()}
          fill="rgba(252, 165, 165, 0.4)"
          stroke="#fca5a5"
          strokeWidth="2"
        />
        
        {/* Data points */}
        {vertexPositions.map((pos, index) => (
          <Circle
            key={index}
            cx={pos.x}
            cy={pos.y}
            r="5"
            fill="white"
            stroke="#fca5a5"
            strokeWidth="2"
          />
        ))}
        
        {/* Labels */}
        {labels.map((label, index) => {
          const pos = getLabelPosition(index);
          return (
            <SvgText
              key={label}
              x={pos.x}
              y={pos.y}
              fill="white"
              fontSize="12"
              fontWeight="500"
              textAnchor="middle"
            >
              {label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

export default function App() {
  const [view, setView] = useState('home');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [wineResult, setWineResult] = useState(null);
  const [myCollection, setMyCollection] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWine, setSelectedWine] = useState(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const screenWidth = Dimensions.get('window').width;

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

  const handleSignUp = async () => {
    setAuthError('');
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      
      Alert.alert('Success', 'Account created! You can now sign in.');
      setIsSignUp(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleSignIn = async () => {
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
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMyCollection([]);
    setView('auth');
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      analyzeWine(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setUploadedImage(result.assets[0].uri);
      analyzeWine(result.assets[0].uri);
    }
  };

  const analyzeWine = async (imageUri) => {
    setAnalyzing(true);
    setView('result');
    
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('image', {
        uri: imageUri,
        name: filename,
        type,
      });
      
      const response = await fetch('https://pastry-art-wine-club.onrender.com/analyze-wine', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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
          : `${aiResult.notes || 'No additional notes available.'}\n\nFrank says: "I haven't tasted this one yet! Bring a bottle to the next meeting."`,
        rating: franksNote ? franksNote.rating : 'TBD',
        flavorProfile: franksNote ? {
          potency: franksNote.potency || 3,
          acidity: franksNote.acidity || 3,
          sweetness: franksNote.sweetness || 3,
          tannins: franksNote.tannins || 3,
          fruitiness: franksNote.fruitiness || 3,
        } : (aiResult.flavorProfile || {
          potency: 3,
          acidity: 3,
          sweetness: 3,
          tannins: 3,
          fruitiness: 3,
        })
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
            rating: wineResult.rating,
            notes: wineResult.notes,
            potency: wineResult.flavorProfile?.potency || 3,
            acidity: wineResult.flavorProfile?.acidity || 3,
            sweetness: wineResult.flavorProfile?.sweetness || 3,
            tannins: wineResult.flavorProfile?.tannins || 3,
            fruitiness: wineResult.flavorProfile?.fruitiness || 3,
          }
        ]);

      if (error) throw error;
      
      await loadUserCollection(user.id);
      Alert.alert('Success', 'Wine added to your collection!');
    } catch (error) {
      console.error('Error adding to collection:', error);
      Alert.alert('Error', 'Could not add wine to collection');
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

  const viewWineDetails = (wine) => {
    setSelectedWine(wine);
    setView('wineDetail');
  };

  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7f1d1d" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.authContainer}>
          <Text style={styles.title}>Wine Club</Text>
          <Text style={styles.subtitle}>Sign in to access your collection</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            {authError ? (
              <Text style={styles.errorText}>{authError}</Text>
            ) : null}

            <TouchableOpacity
              style={styles.button}
              onPress={isSignUp ? handleSignUp : handleSignIn}
            >
              <Text style={styles.buttonText}>
                {isSignUp ? 'Sign Up' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
              }}
            >
              <Text style={styles.linkText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'result') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setView('home')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          {uploadedImage && (
            <Image
              source={{ uri: uploadedImage }}
              style={styles.wineImage}
            />
          )}

          {analyzing ? (
            <View style={styles.analyzingCard}>
              <ActivityIndicator size="large" color="#7f1d1d" />
              <Text style={styles.analyzingText}>Analyzing your wine...</Text>
              <Text style={styles.analyzingSubtext}>Consulting Frank's notes</Text>
            </View>
          ) : wineResult ? (
            <View style={styles.resultCard}>
              <Text style={styles.wineName}>{wineResult.name}</Text>
              
              <View style={styles.wineDetails}>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Varietal:</Text> {wineResult.varietal}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Region:</Text> {wineResult.region}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Vintage:</Text> {wineResult.vintage}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.detailLabel}>Rating:</Text> {wineResult.rating}
                </Text>
              </View>
              {wineResult.flavorProfile && (
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>Flavor Profile</Text>
                  <CustomRadarChart 
                    data={wineResult.flavorProfile} 
                    size={Math.min(screenWidth - 80, 280)}
                  />
                </View>
              )}

              <View style={styles.notesCard}>
                <Text style={styles.notesTitle}>Frank's Notes</Text>
                <Text style={styles.notesText}>{wineResult.notes}</Text>
              </View>

              <TouchableOpacity
                style={styles.button}
                onPress={addToCollection}
              >
                <Text style={styles.buttonText}>Add to My Collection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setUploadedImage(null);
                  setWineResult(null);
                  setView('home');
                }}
              >
                <Text style={styles.secondaryButtonText}>Scan Another Wine</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'wineDetail' && selectedWine) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setView('collection')}
          >
            <Text style={styles.backButtonText}>← Back to Collection</Text>
          </TouchableOpacity>

          <View style={styles.resultCard}>
            <Text style={styles.wineName}>{selectedWine.wine_name}</Text>
            
            <View style={styles.wineDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Varietal:</Text> {selectedWine.varietal}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Region:</Text> {selectedWine.region}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Vintage:</Text> {selectedWine.vintage}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Rating:</Text> {selectedWine.rating}
              </Text>
            </View>

            {selectedWine.potency && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Flavor Profile</Text>
                <CustomRadarChart 
                  data={{
                    potency: selectedWine.potency,
                    acidity: selectedWine.acidity,
                    sweetness: selectedWine.sweetness,
                    tannins: selectedWine.tannins,
                    fruitiness: selectedWine.fruitiness,
                  }} 
                  size={Math.min(screenWidth - 80, 280)}
                />
              </View>
            )}

            <View style={styles.notesCard}>
              <Text style={styles.notesTitle}>Frank's Notes</Text>
              <Text style={styles.notesText}>{selectedWine.notes}</Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButtonLarge}
              onPress={() => {
                removeFromCollection(selectedWine.id);
                setView('collection');
              }}
            >
              <Text style={styles.deleteButtonText}>Remove from Collection</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (view === 'collection') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setView('home')}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.collectionTitle}>My Wine Collection</Text>

          {myCollection.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No wines yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Start scanning wines to build your collection!
              </Text>
            </View>
          ) : (
            myCollection.map((wine) => (
              <TouchableOpacity 
                key={wine.id} 
                style={styles.collectionItem}
                onPress={() => viewWineDetails(wine)}
              >
                <View style={styles.collectionItemHeader}>
                  <Text style={styles.collectionItemName}>{wine.wine_name}</Text>
                  <TouchableOpacity 
                    onPress={(e) => {
                      e.stopPropagation();
                      removeFromCollection(wine.id);
                    }}
                  >
                    <Text style={styles.deleteButton}>✕</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.collectionItemDetails}>
                  {wine.varietal} • {wine.region}
                </Text>
                {wine.vintage && wine.vintage !== 'N/A' && (
                  <Text style={styles.collectionItemVintage}>Vintage: {wine.vintage}</Text>
                )}
                <Text style={styles.collectionItemDate}>
                  Added: {new Date(wine.date_added).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome!</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
          >
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.appTitle}>Wine Club</Text>
        <Text style={styles.appSubtitle}>Featuring Frank's Expert Notes</Text>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={takePhoto}
          >
            <Text style={styles.actionIcon}>ðŸ“·</Text>
            <Text style={styles.actionTitle}>Take Photo</Text>
            <Text style={styles.actionSubtitle}>Snap a picture of your wine</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={pickImage}
          >
            <Text style={styles.actionIcon}>ðŸ“¤</Text>
            <Text style={styles.actionTitle}>Upload Photo</Text>
            <Text style={styles.actionSubtitle}>Choose from your gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.collectionCard]}
            onPress={() => setView('collection')}
          >
            <Text style={styles.actionIcon}>ðŸ“š</Text>
            <Text style={[styles.actionTitle, styles.collectionText]}>My Collection</Text>
            <Text style={[styles.actionSubtitle, styles.collectionText]}>
              {myCollection.length} wines saved
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#7f1d1d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7f1d1d',
  },
  scrollContent: {
    padding: 20,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fca5a5',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#7f1d1d',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  linkText: {
    color: '#7f1d1d',
    textAlign: 'center',
    marginTop: 15,
    fontSize: 14,
  },
  errorText: {
    color: '#dc2626',
    marginBottom: 10,
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  emailText: {
    fontSize: 14,
    color: '#fca5a5',
  },
  signOutButton: {
    backgroundColor: '#991b1b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  signOutText: {
    color: 'white',
    fontSize: 14,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 16,
    color: '#fca5a5',
    textAlign: 'center',
    marginBottom: 30,
  },
  actionButtons: {
    gap: 15,
  },
  actionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 5,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
  collectionCard: {
    backgroundColor: '#991b1b',
  },
  collectionText: {
    color: 'white',
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#fca5a5',
    fontSize: 16,
  },
  wineImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    marginBottom: 20,
  },
  analyzingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f1d1d',
    marginTop: 15,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#991b1b',
    marginTop: 5,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  wineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7f1d1d',
    marginBottom: 15,
  },
  wineDetails: {
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    color: '#7f1d1d',
    marginBottom: 5,
  },
  detailLabel: {
    fontWeight: '600',
  },
  notesCard: {
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: '#7f1d1d',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#991b1b',
  },
  secondaryButton: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#7f1d1d',
    fontSize: 16,
    fontWeight: '600',
  },
  collectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f1d1d',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#991b1b',
    textAlign: 'center',
  },
  collectionItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  collectionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7f1d1d',
    flex: 1,
  },
  deleteButton: {
    fontSize: 24,
    color: '#dc2626',
    padding: 5,
  },
  deleteButtonLarge: {
    backgroundColor: '#dc2626',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  collectionItemDetails: {
    fontSize: 14,
    color: '#991b1b',
    marginBottom: 5,
  },
  collectionItemVintage: {
    fontSize: 14,
    color: '#b91c1c',
  },
  collectionItemDate: {
    fontSize: 12,
    color: '#b91c1c',
    marginTop: 5,
  },

  chartCard: {
  backgroundColor: '#7f1d1d',
  borderRadius: 12,
  padding: 15,
  marginBottom: 15,
  alignItems: 'center',
},
chartTitle: {
  fontSize: 18,
  fontWeight: '600',
  color: 'white',
  marginBottom: 10,
},
flavorProfileTable: {
  width: '100%',
},
flavorRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.2)',
},
flavorLabel: {
  fontSize: 16,
  color: 'white',
  fontWeight: '500',
  flex: 1,
},
ratingContainer: {
  flexDirection: 'row',
  alignItems: 'center',
},
radarContainer: {
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
},
radarGrid: {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
},
gridPentagon: {
  position: 'absolute',
  borderWidth: 1,
  alignSelf: 'center',
  transform: [{ rotate: '36deg' }],
},
radialLine: {
  position: 'absolute',
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.3)',
  transformOrigin: '0 0',
},
dataPolygonContainer: {
  position: 'absolute',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: '100%',
},
filledPentagon: {
  position: 'absolute',
  backgroundColor: 'rgba(252, 165, 165, 0.3)',
  borderColor: '#fca5a5',
  borderWidth: 2,
  alignSelf: 'center',
  transform: [{ rotate: '36deg' }],
},
dataLayer: {
  position: 'absolute',
  width: '100%',
  height: '100%',
},
dataPoint: {
  position: 'absolute',
  width: 12,
  height: 12,
  borderRadius: 6,
  borderWidth: 2,
  borderColor: '#fca5a5',
},
labelLayer: {
  position: 'absolute',
  width: '100%',
  height: '100%',
},
radarLabel: {
  position: 'absolute',
  color: 'white',
  fontSize: 12,
  fontWeight: '500',
  textAlign: 'center',
  width: 60,
},
});