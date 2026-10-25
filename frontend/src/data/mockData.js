
export const CITIES = [
  { id: 'delhi', name: 'Delhi-NCR', count: 48 },
  { id: 'mumbai', name: 'Mumbai', count: 62 },
  { id: 'bengaluru', name: 'Bengaluru', count: 39 },
  { id: 'hyderabad', name: 'Hyderabad', count: 34 },
  { id: 'chennai', name: 'Chennai', count: 28 },
  { id: 'pune', name: 'Pune', count: 22 },
  { id: 'kolkata', name: 'Kolkata', count: 25 },
  { id: 'ahmedabad', name: 'Ahmedabad', count: 19 },
];

export const GENRES = [
  { id: 'all', name: 'All Genres', icon: 'Film' },
  { id: 'action', name: 'Action', icon: 'Flame' },
  { id: 'sci-fi', name: 'Sci-Fi', icon: 'Rocket' },
  { id: 'drama', name: 'Drama', icon: 'Heart' },
  { id: 'thriller', name: 'Thriller', icon: 'Eye' },
  { id: 'comedy', name: 'Comedy', icon: 'Smile' },
  { id: 'horror', name: 'Horror', icon: 'Ghost' },
  { id: 'animation', name: 'Animation', icon: 'Sparkles' },
  { id: 'adventure', name: 'Adventure', icon: 'Compass' },
];

export const FORMATS = ['All Formats', 'IMAX 3D', 'IMAX Laser', '4DX', '3D', '2D'];
export const LANGUAGES = ['All Languages', 'English', 'Hindi', 'Tamil', 'Telugu'];

export const MOVIE_CATEGORIES = [
  { id: 'all', name: 'All Movies' },
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'hollywood', name: 'Hollywood' },
];

export const BOLLYWOOD_MOVIES = [
  {
    id: 'dhurandhar',
    tmdbId: 1311031,
    title: 'Dhurandhar',
    slug: 'dhurandhar',
    certificate: 'U/A 16+',
    duration: '2h 38m',
    rating: 8.9,
    voteCount: 'Anticipated',
    releaseDate: 'Dec 25, 2025',
    languages: ['Hindi'],
    formats: ['IMAX Laser', '2D', '4DX'],
    genres: ['Action', 'Thriller', 'Crime'],
    industry: 'bollywood',
    poster: '/images/bollywood/dhurandhar.png',
    backdrop: '/images/bollywood/dhurandhar.png',
    synopsis: 'An elite undercover Indian intelligence operative leads a perilous covert operation into hostile international territory to dismantle a clandestine syndicate threatening national security.',
    director: 'Aditya Dhar',
    cast: [
      { name: 'Ranveer Singh', role: 'Major Kabir', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Sanjay Dutt', role: 'Bhairav', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'R. Madhavan', role: 'Intelligence Chief', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Akshaye Khanna', role: 'DCP Rathore', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'HIGH-OCTANE SPY THRILLER',
    priceStartingAt: 280,
    tags: ['bollywood', 'trending', 'coming-soon', 'hidden-gems']
  },
  {
    id: 'jawan',
    tmdbId: 872585,
    title: 'Jawan',
    slug: 'jawan',
    certificate: 'U/A 16+',
    duration: '2h 49m',
    rating: 8.4,
    voteCount: '380K+',
    releaseDate: 'Sep 07, 2023',
    languages: ['Hindi', 'Tamil', 'Telugu'],
    formats: ['IMAX Laser', '4DX', '2D'],
    genres: ['Action', 'Thriller', 'Drama'],
    industry: 'bollywood',
    poster: '/images/bollywood/jawan.jpg',
    backdrop: '/images/bollywood/jawan.jpg',
    synopsis: 'A driven prison warden and his squad of brave inmates initiate bold vigilante strikes to correct societal injustice, confronting a corrupt arms titan while reclaiming his family heritage.',
    director: 'Atlee',
    cast: [
      { name: 'Shah Rukh Khan', role: 'Vikram Rathore / Azad', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Nayanthara', role: 'Narmada Rai', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Vijay Sethupathi', role: 'Kaleeswaran', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Deepika Padukone', role: 'Aishwarya Rathore', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'RECORD-BREAKING MEGA BLOCKBUSTER',
    priceStartingAt: 270,
    tags: ['bollywood', 'trending', 'popular', 'now-showing', 'new-releases', 'audience-favourite']
  },
  {
    id: 'stree-2',
    tmdbId: 1147710,
    title: 'Stree 2',
    slug: 'stree-2',
    certificate: 'U/A 16+',
    duration: '2h 27m',
    rating: 8.3,
    voteCount: '210K+',
    releaseDate: 'Aug 15, 2024',
    languages: ['Hindi'],
    formats: ['2D', 'IMAX Laser'],
    genres: ['Comedy', 'Horror'],
    industry: 'bollywood',
    poster: '/images/bollywood/stree2.jpg',
    backdrop: '/images/bollywood/stree2.jpg',
    synopsis: 'After the events of Stree, the town of Chanderi is terrorized by Sarkata. Vicky, Bittu, Janna and Rudra join forces with the mysterious Stree to defeat the malevolent entity.',
    director: 'Amar Kaushik',
    cast: [
      { name: 'Rajkummar Rao', role: 'Vicky', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Shraddha Kapoor', role: 'She', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Pankaj Tripathi', role: 'Rudra', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'ALL-TIME BLOCKBUSTER',
    priceStartingAt: 250,
    tags: ['bollywood', 'trending', 'popular', 'now-showing', 'new-releases', 'audience-favourite']
  },
  {
    id: 'chhaava',
    tmdbId: 1184919,
    title: 'Chhaava',
    slug: 'chhaava',
    certificate: 'U/A 16+',
    duration: '2h 45m',
    rating: 8.8,
    voteCount: 'Anticipated',
    releaseDate: 'Feb 14, 2025',
    languages: ['Hindi', 'Marathi'],
    formats: ['IMAX Laser', '2D', '4DX'],
    genres: ['Action', 'Drama', 'History'],
    industry: 'bollywood',
    poster: '/images/bollywood/chhaava.jpg',
    backdrop: '/images/bollywood/chhaava.jpg',
    synopsis: 'The valorous historical saga of Chhatrapati Sambhaji Maharaj, the fearless second ruler of the Maratha Empire, defending Swarajya against the overwhelming Mughal armada.',
    director: 'Laxman Utekar',
    cast: [
      { name: 'Vicky Kaushal', role: 'Chhatrapati Sambhaji Maharaj', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Rashmika Mandanna', role: 'Yesubai Bhonsale', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Akshaye Khanna', role: 'Emperor Aurangzeb', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'EPIC HISTORICAL MASTERPIECE',
    priceStartingAt: 260,
    tags: ['bollywood', 'popular', 'coming-soon']
  },
  {
    id: 'saiyaara',
    tmdbId: 1289124,
    title: 'Saiyaara',
    slug: 'saiyaara',
    certificate: 'U/A 13+',
    duration: '2h 18m',
    rating: 8.2,
    voteCount: '110K+',
    releaseDate: 'Nov 14, 2025',
    languages: ['Hindi'],
    formats: ['2D'],
    genres: ['Romance', 'Drama', 'Musical'],
    industry: 'bollywood',
    poster: '/images/bollywood/saiyaara.png',
    backdrop: '/images/bollywood/saiyaara.png',
    synopsis: 'A soulful, deeply moving musical romance tracing the bittersweet voyage of two passionate artists whose profound connection defies distance, heartbreak, and societal expectations.',
    director: 'Mohit Suri',
    cast: [
      { name: 'Ahaan Panday', role: 'Aryan', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Diana Penty', role: 'Tara', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'SOULFUL MUSICAL ODYSSEY',
    priceStartingAt: 220,
    tags: ['bollywood', 'audience-favourite', 'coming-soon', 'hidden-gems']
  },
  {
    id: 'animal',
    tmdbId: 781732,
    title: 'Animal',
    slug: 'animal',
    certificate: 'A',
    duration: '3h 24m',
    rating: 8.1,
    voteCount: '310K+',
    releaseDate: 'Dec 01, 2023',
    languages: ['Hindi', 'Telugu'],
    formats: ['2D', 'IMAX Laser'],
    genres: ['Action', 'Crime', 'Drama'],
    industry: 'bollywood',
    poster: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'A fraught father-son bond spirals into an unrelenting, blood-soaked war when an industrialist is targeted in an assassination attempt, compelling his ferocious son into dark vengeance.',
    director: 'Sandeep Reddy Vanga',
    cast: [
      { name: 'Ranbir Kapoor', role: 'Ranvijay Singh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Anil Kapoor', role: 'Balbir Singh', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Bobby Deol', role: 'Abrar Haque', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Rashmika Mandanna', role: 'Geetanjali', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'UNRELENTING ACTION DRAMA',
    priceStartingAt: 260,
    tags: ['bollywood', 'popular', 'now-showing', 'new-releases', 'audience-favourite']
  }
];

export const HOLLYWOOD_MOVIES = [
  {
    id: 'avatar-3',
    tmdbId: 83533,
    title: 'Avatar: Fire and Ash',
    slug: 'avatar-fire-and-ash',
    certificate: 'U/A 13+',
    duration: '3h 15m',
    rating: 9.2,
    voteCount: 'Anticipated',
    releaseDate: 'Dec 19, 2025',
    languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
    formats: ['IMAX 3D', '4DX', '3D'],
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'The Sully family faces new peril as they encounter the Ash People, a volcanic clan of Na\'vi with aggressive instincts on Pandora.',
    director: 'James Cameron',
    cast: [
      { name: 'Sam Worthington', role: 'Jake Sully', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Zoe Saldana', role: 'Neytiri', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'COMING SOON TO CINEMAS',
    priceStartingAt: 350,
    tags: ['hollywood', 'trending', 'coming-soon']
  },
  {
    id: 'interstellar',
    tmdbId: 157336,
    title: 'Interstellar',
    slug: 'interstellar',
    certificate: 'U/A 13+',
    duration: '2h 49m',
    rating: 8.7,
    voteCount: '980K+',
    releaseDate: 'Nov 07, 2014',
    languages: ['English', 'Hindi'],
    formats: ['IMAX Laser', '2D'],
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft along with a team of researchers through a mysterious wormhole near Saturn.',
    director: 'Christopher Nolan',
    cast: [
      { name: 'Matthew McConaughey', role: 'Cooper', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Anne Hathaway', role: 'Brand', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'SPECIAL IMAX RE-RELEASE',
    priceStartingAt: 350,
    tags: ['hollywood', 'popular', 'audience-favourite', 'now-showing']
  },
  {
    id: 'inception',
    tmdbId: 27205,
    title: 'Inception',
    slug: 'inception',
    certificate: 'U/A 13+',
    duration: '2h 28m',
    rating: 8.8,
    voteCount: '1.2M+',
    releaseDate: 'Jul 16, 2010',
    languages: ['English', 'Hindi'],
    formats: ['IMAX 2D', '2D'],
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Dom Cobb is a skilled thief who steals corporate secrets through dream-sharing technology. He is offered a chance to regain his old life as payment for a nearly impossible task: inception.',
    director: 'Christopher Nolan',
    cast: [
      { name: 'Leonardo DiCaprio', role: 'Dom Cobb', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Joseph Gordon-Levitt', role: 'Arthur', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Elliot Page', role: 'Ariadne', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'MIND-BENDING SCI-FI THRILLER',
    priceStartingAt: 300,
    tags: ['hollywood', 'popular', 'audience-favourite', 'now-showing']
  },
  {
    id: 'avengers-endgame',
    tmdbId: 299534,
    title: 'Avengers: Endgame',
    slug: 'avengers-endgame',
    certificate: 'U/A 13+',
    duration: '3h 01m',
    rating: 8.9,
    voteCount: '1.5M+',
    releaseDate: 'Apr 26, 2019',
    languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
    formats: ['IMAX 3D', '4DX', '3D', '2D'],
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'After the devastation wrought by Thanos, the remaining Avengers assemble for one final stand across time to restore what was lost and safeguard the universe.',
    director: 'Anthony Russo, Joe Russo',
    cast: [
      { name: 'Robert Downey Jr.', role: 'Tony Stark / Iron Man', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80' },
      { name: 'Chris Evans', role: 'Steve Rogers / Captain America', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Chris Hemsworth', role: 'Thor', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'THE ULTIMATE MARVEL FINALE',
    priceStartingAt: 320,
    tags: ['hollywood', 'trending', 'popular', 'now-showing', 'audience-favourite']
  },
  {
    id: 'the-batman',
    tmdbId: 414906,
    title: 'The Batman',
    slug: 'the-batman',
    certificate: 'U/A 16+',
    duration: '2h 56m',
    rating: 8.4,
    voteCount: '670K+',
    releaseDate: 'Mar 04, 2022',
    languages: ['English', 'Hindi'],
    formats: ['IMAX Laser', '2D'],
    genres: ['Action', 'Crime', 'Drama', 'Mystery'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a sadistic serial killer known as the Riddler.',
    director: 'Matt Reeves',
    cast: [
      { name: 'Robert Pattinson', role: 'Bruce Wayne / Batman', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80' },
      { name: 'Zoë Kravitz', role: 'Selina Kyle / Catwoman', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Paul Dano', role: 'Edward Nashton / The Riddler', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: false,
    heroTag: 'DARK NEO-NOIR DETECTIVE MASTERPIECE',
    priceStartingAt: 280,
    tags: ['hollywood', 'popular', 'now-showing', 'audience-favourite', 'hidden-gems']
  },
  {
    id: 'dune-2',
    tmdbId: 693134,
    title: 'Dune: Part Two',
    slug: 'dune-part-two',
    certificate: 'U/A 16+',
    duration: '2h 46m',
    rating: 8.8,
    voteCount: '480K+',
    releaseDate: 'Mar 01, 2024',
    languages: ['English', 'Hindi'],
    formats: ['IMAX 3D', '4DX', '2D'],
    genres: ['Sci-Fi', 'Action', 'Adventure'],
    industry: 'hollywood',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=700&q=80',
    backdrop: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
    synopsis: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.',
    director: 'Denis Villeneuve',
    cast: [
      { name: 'Timothée Chalamet', role: 'Paul Atreides', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80' },
      { name: 'Zendaya', role: 'Chani', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80' },
      { name: 'Rebecca Ferguson', role: 'Lady Jessica', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80' },
      { name: 'Javier Bardem', role: 'Stilgar', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' }
    ],
    isHeroFeatured: true,
    heroTag: 'TRENDING #1 WORLDWIDE',
    priceStartingAt: 320,
    tags: ['hollywood', 'trending', 'popular', 'now-showing', 'new-releases', 'audience-favourite']
  }
];

export const MOVIES = [...BOLLYWOOD_MOVIES, ...HOLLYWOOD_MOVIES];

export const ENTERTAINMENT_EVENTS = [
  {
    id: 'evt-1',
    title: 'Diljit Dosanjh: Dil-Luminati India Tour 2026',
    category: 'Music Concert',
    categoryIcon: 'Music',
    badge: 'SELLING FAST',
    date: 'Sat, 26 Oct 2026 • 7:00 PM',
    venue: 'Jawaharlal Nehru Stadium, New Delhi',
    city: 'delhi',
    poster: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=700&q=80',
    priceStartingAt: 1999,
    description: 'Experience the electric Punjabi superstar Diljit Dosanjh live in his blockbuster stadium tour featuring chart-toppers and high-octane production.'
  },
  {
    id: 'evt-2',
    title: 'Grand Navratri Dandiya Utsav 2026',
    category: 'Cultural Festival',
    categoryIcon: 'Sparkles',
    badge: 'POPULAR IN DELHI',
    date: '18 - 24 Oct 2026 • 8:00 PM',
    venue: 'Indira Gandhi Indoor Stadium, New Delhi',
    city: 'delhi',
    poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=700&q=80',
    priceStartingAt: 699,
    description: 'Delhi\'s biggest festive Dandiya & Garba extravaganza with live folk orchestra, celebrity performers, food carnival, and prizes for best traditional attire.'
  },
  {
    id: 'evt-3',
    title: 'Zakir Khan Live: Tathastu & New Stories',
    category: 'Stand-up Comedy',
    categoryIcon: 'Smile',
    badge: 'LIMITED SEATS',
    date: 'Fri, 08 Nov 2026 • 8:30 PM',
    venue: 'Sirifort Auditorium, New Delhi',
    city: 'delhi',
    poster: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=700&q=80',
    priceStartingAt: 999,
    description: 'The Sakht Launda returns with an hour of heartwarming stories, relatable Indian humor, and sharp observational comedy.'
  },
  {
    id: 'evt-4',
    title: 'Coldplay: Music of the Spheres Stadium Tour',
    category: 'Global Stadium Concert',
    categoryIcon: 'Flame',
    badge: 'WORLD TOUR',
    date: 'Sat, 18 Jan 2027 • 6:30 PM',
    venue: 'DY Patil Stadium, Navi Mumbai',
    city: 'mumbai',
    poster: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=700&q=80',
    priceStartingAt: 2500,
    description: 'British rock icon Coldplay performs under the stars with LED wristbands, lasers, fireworks, and timeless anthems like Fix You and Yellow.'
  },
  {
    id: 'evt-5',
    title: 'Sunburn Arena featuring Alan Walker',
    category: 'EDM Concert',
    categoryIcon: 'Zap',
    badge: 'EXCLUSIVE',
    date: 'Sun, 17 Nov 2026 • 5:00 PM',
    venue: 'Gymkhana Club Grounds, Sector 29, Gurugram',
    city: 'delhi',
    poster: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=700&q=80',
    priceStartingAt: 1499,
    description: 'Global electronic sensation Alan Walker brings his Walkerworld tour to NCR with dazzling visuals, bass drops, and mega-hits.'
  }
];

export const THEATRES = [
  {
    id: 'th-1',
    name: "PVR Director's Cut",
    location: "Ambience Mall, Vasant Kunj, New Delhi",
    city: 'delhi',
    distance: '3.4 km away',
    amenities: ['Dolby Atmos', '4K Laser', 'Luxury Recliners', 'Gourmet In-Seat Dining'],
    cancellationAvailable: true,
    screens: [
      {
        id: 'screen-1',
        name: 'Screen 1 — IMAX Laser',
        format: 'IMAX 3D',
        showtimes: [
          { time: '10:30 AM', price: 450, status: 'available' },
          { time: '02:00 PM', price: 520, status: 'fast-filling' },
          { time: '06:15 PM', price: 650, status: 'almost-full' },
          { time: '09:45 PM', price: 590, status: 'available' }
        ]
      },
      {
        id: 'screen-2',
        name: 'Screen 2 — Dolby Atmos Luxury',
        format: '2D',
        showtimes: [
          { time: '11:45 AM', price: 350, status: 'available' },
          { time: '03:30 PM', price: 380, status: 'available' },
          { time: '07:30 PM', price: 420, status: 'fast-filling' }
        ]
      }
    ]
  },
  {
    id: 'th-2',
    name: 'PVR INOX Megaplex',
    location: 'Eros Corporate Tower, Nehru Place, New Delhi',
    city: 'delhi',
    distance: '5.8 km away',
    amenities: ['IMAX Laser', '4DX Motion', 'Dolby 7.1', 'Valet Parking'],
    cancellationAvailable: true,
    screens: [
      {
        id: 'screen-1',
        name: 'Audi 3 — IMAX Laser',
        format: 'IMAX 3D',
        showtimes: [
          { time: '09:45 AM', price: 420, status: 'available' },
          { time: '01:15 PM', price: 480, status: 'available' },
          { time: '05:00 PM', price: 580, status: 'fast-filling' },
          { time: '08:45 PM', price: 620, status: 'almost-full' }
        ]
      },
      {
        id: 'screen-2',
        name: 'Audi 5 — 4DX Motion Theatre',
        format: '4DX',
        showtimes: [
          { time: '12:30 PM', price: 490, status: 'available' },
          { time: '04:15 PM', price: 550, status: 'fast-filling' },
          { time: '08:00 PM', price: 550, status: 'available' }
        ]
      }
    ]
  },
  {
    id: 'th-3',
    name: 'Cinépolis VIP',
    location: 'DLF Avenue Mall, Saket, New Delhi',
    city: 'delhi',
    distance: '7.1 km away',
    amenities: ['Macro XE', 'RealD 3D', 'VIP Butler Service', 'Recliner Loungers'],
    cancellationAvailable: false,
    screens: [
      {
        id: 'screen-1',
        name: 'Screen 4 — Macro XE',
        format: '2D',
        showtimes: [
          { time: '10:00 AM', price: 320, status: 'available' },
          { time: '01:45 PM', price: 360, status: 'available' },
          { time: '05:30 PM', price: 420, status: 'fast-filling' },
          { time: '09:15 PM', price: 440, status: 'available' }
        ]
      }
    ]
  },
  {
    id: 'th-4',
    name: 'Miraj Cinemas Superdome',
    location: 'Subhash Nagar Metro Station, New Delhi',
    city: 'delhi',
    distance: '9.2 km away',
    amenities: ['Dolby Atmos', 'RGB Laser Projection', 'Café Lounge'],
    cancellationAvailable: true,
    screens: [
      {
        id: 'screen-1',
        name: 'Audi 1 — Laser 4K',
        format: '2D',
        showtimes: [
          { time: '11:15 AM', price: 240, status: 'available' },
          { time: '02:45 PM', price: 280, status: 'available' },
          { time: '06:30 PM', price: 320, status: 'almost-full' },
          { time: '10:15 PM', price: 280, status: 'available' }
        ]
      }
    ]
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'CNB-984210',
    movieId: 'dune-2',
    movieTitle: 'Dune: Part Two',
    moviePoster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=80',
    certificate: 'U/A 16+',
    format: 'IMAX 3D',
    language: 'English',
    theatreName: "PVR Director's Cut",
    theatreLocation: 'Ambience Mall, Vasant Kunj, Delhi',
    screenName: 'Screen 1 — IMAX Laser',
    date: 'Fri, 24 Oct 2026',
    time: '06:15 PM',
    seats: ['F7', 'F8'],
    seatTier: 'Premium',
    ticketCount: 2,
    baseAmount: 1040,
    convenienceFee: 118,
    discountAmount: 150,
    totalAmount: 1008,
    bookingDate: '2026-10-20T11:20:00Z',
    status: 'CONFIRMED',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=CNB-984210-DUNE2-F7F8'
  },
  {
    id: 'CNB-841923',
    movieId: 'oppenheimer',
    movieTitle: 'Oppenheimer',
    moviePoster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&w=300&q=80',
    certificate: 'A',
    format: 'IMAX Laser',
    language: 'English',
    theatreName: 'PVR INOX Megaplex',
    theatreLocation: 'Eros Corporate Tower, Nehru Place, Delhi',
    screenName: 'Audi 3 — IMAX Laser',
    date: 'Sun, 12 Oct 2026',
    time: '08:45 PM',
    seats: ['H11', 'H12'],
    seatTier: 'VIP Recliner',
    ticketCount: 2,
    baseAmount: 1240,
    convenienceFee: 140,
    discountAmount: 0,
    totalAmount: 1380,
    bookingDate: '2026-10-09T14:45:00Z',
    status: 'COMPLETED',
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=CNB-841923-OPP-H11H12'
  }
];

export const PROMO_CODES = [
  { code: 'CINEPASS20', discountPercent: 20, description: '20% off up to ₹150 on tickets' },
  { code: 'IMAX50', discountFlat: 50, description: 'Flat ₹50 off on IMAX screenings' },
  { code: 'WELCOME100', discountFlat: 100, description: '₹100 off on first booking' }
];

export const ORGANIZER_STATS = {
  totalRevenue: 284500,
  revenueToday: 34800,
  activeShows: 18,
  ticketsSoldToday: 246,
  averageOccupancy: '82%',
  weeklyRevenueData: [
    { day: 'Mon', revenue: 24000, bookings: 160 },
    { day: 'Tue', revenue: 28500, bookings: 195 },
    { day: 'Wed', revenue: 31000, bookings: 210 },
    { day: 'Thu', revenue: 33200, bookings: 230 },
    { day: 'Fri', revenue: 48900, bookings: 340 },
    { day: 'Sat', revenue: 64200, bookings: 430 },
    { day: 'Sun', revenue: 54700, bookings: 380 }
  ]
};

export const ADMIN_STATS = {
  totalPlatformRevenue: 4892400,
  monthlyGrowth: '+18.4%',
  totalRegisteredUsers: 142850,
  activeTheatres: 284,
  totalBookingsMonth: 42190,
  popularCities: [
    { name: 'Delhi-NCR', bookings: '38%', share: 38 },
    { name: 'Mumbai', bookings: '32%', share: 32 },
    { name: 'Bengaluru', bookings: '18%', share: 18 },
    { name: 'Others', bookings: '12%', share: 12 }
  ]
};
