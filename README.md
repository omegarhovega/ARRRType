# ARRRType <img src="https://github.com/omegarhovega/ARRRType/blob/main/public/avatar.webp?raw=true" alt="avatar" width="20"/> 

ARRRType is an open source typing trainer, made by pirates for pirates <img src="https://github.com/omegarhovega/ARRRType/blob/main/public/pirate_s2.webp?raw=true" alt="pirate" width="15"/>. It will help you improve your typing speed and accuracy while embarking on a swashbuckling adventure. 

Practice your typing skills against computer opponents, challenge other players, and track your progress with detailed statistics.

A live version is currently at https://arrrtype.com.

## Features <img src="https://github.com/omegarhovega/ARRRType/blob/main/public/ship_p.webp?raw=true" alt="ship" width="20"/>

- **Campaign Mode**: Battle through progressive levels against computer opponents with increasing difficulty
- **Training Modes**: 
  - Regular training against computer opponents
  - Single word practice
  - Custom text practice
  - Learn from your mistakes with targeted practice
- **Multiplayer**: Challenge other players in real-time typing battles
- **Detailed Statistics**: 
  - Track your WPM (Words Per Minute)
  - Monitor accuracy
  - View typing consistency
  - Analyze problem characters with heatmaps
  - Identify slow words and mistypes
- **Customization**:
  - Choose your avatar
  - Select your flag
  - Adjust opponent difficulty
  - Toggle forced correction mode
  - Customize text length

## Installation & Setup ⚓

### Prerequisites

- Node.js (v14.17.0 or higher)
- npm (Node Package Manager)
- Git
- A Supabase account

### Local Development Setup

1. **Clone the Repository**
```bash
git clone https://github.com/yourusername/ARRRType.git
cd ARRRType
```

2. **Install Dependencies**
```bash
npm install
```

3. **Supabase Setup**

a. Create a new Supabase project:
- Go to [Supabase](https://supabase.com)
- Sign up/Login and create a new project
- Note down your project URL and anon key

b. Set up the required tables in Supabase:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  coins INTEGER DEFAULT 0,
  last_unlocked_level INTEGER DEFAULT 1,
  games_played INTEGER DEFAULT 0,
  time_played INTEGER DEFAULT 0,
  last_round_wpm INTEGER[],
  last_round_gross_wpm INTEGER[],
  wpm_buckets INTEGER[],
  accuracy_buckets INTEGER[],
  '100_slow_words' JSONB,
  'last_slow_words' JSONB
);

-- Create user_stats table
CREATE TABLE user_stats (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  wpm INTEGER,
  grossWPM INTEGER,
  accuracy FLOAT,
  wpmPerSecond INTEGER[],
  grossWpmPerSecond INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  errors JSONB,
  totalOccurrences JSONB,
  mistakesMade JSONB,
  consistency FLOAT
);

-- Create texts table
CREATE TABLE texts (
  id SERIAL PRIMARY KEY,
  text TEXT NOT NULL
);

-- Create words table
CREATE TABLE words (
  id SERIAL PRIMARY KEY,
  '3_letters' TEXT NOT NULL
);

-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  text_id INTEGER REFERENCES texts(id),
  start_time TIMESTAMPTZ,
  players UUID[],
  finishing_times JSONB,
  heartbeat JSONB
);

-- Create total_games table
CREATE TABLE total_games (
  id SERIAL PRIMARY KEY,
  total_time BIGINT DEFAULT 0,
  total_count INTEGER DEFAULT 0,
  wpmbuckets INTEGER[],
  accuracybuckets INTEGER[],
  grosswpmbuckets INTEGER[]
);
```

c. Set up the required functions in Supabase:

```sql
-- Create update_heartbeat function
CREATE OR REPLACE FUNCTION update_heartbeat(game_id UUID, user_id UUID)
RETURNS VOID AS $$
DECLARE
  current_heartbeat JSONB;
  current_timestamp TIMESTAMPTZ;
BEGIN
  -- Get current timestamp
  current_timestamp := NOW();
  
  -- Get current heartbeat data
  SELECT heartbeat INTO current_heartbeat FROM games WHERE id = game_id;
  
  -- If heartbeat is null, initialize it as an empty array
  IF current_heartbeat IS NULL THEN
    current_heartbeat := '[]'::JSONB;
  END IF;
  
  -- Remove old entry for this user if it exists
  current_heartbeat := current_heartbeat - (
    SELECT ordinality - 1
    FROM jsonb_array_elements(current_heartbeat) WITH ORDINALITY
    WHERE (value->>'user_id')::UUID = user_id
  );
  
  -- Add new heartbeat entry
  current_heartbeat := current_heartbeat || jsonb_build_array(
    jsonb_build_object(
      'user_id', user_id,
      'timestamp', current_timestamp
    )
  );
  
  -- Update the games table
  UPDATE games 
  SET heartbeat = current_heartbeat
  WHERE id = game_id;
END;
$$ LANGUAGE plpgsql;
```

4. **Database Population**

You can populate the database with sample texts and words using the provided CSV files:

1. **Import words_rows.csv**:
   - Navigate to your Supabase project dashboard
   - Go to Table Editor > words
   - Click on "Import Data"
   - Select "CSV"
   - Upload the `words_rows.csv` file
   - Map the CSV column to the '3_letters' column
   - Click "Import Data"

2. **Import texts_rows.csv**:
   - Navigate to Table Editor > texts
   - Click on "Import Data"
   - Select "CSV"
   - Upload the `texts_rows.csv` file
   - Map the CSV column to the 'text' column
   - Click "Import Data"

#### Location of CSV Files
- The CSV files are located in the `/table data` directory of the project
- `words_rows.csv`: Contains sample words for typing exercises
- `texts_rows.csv`: Contains sample texts for typing challenges

Note: If you encounter any encoding issues during import, ensure your CSV files are UTF-8 encoded.

5. **Environment Setup**

Create a `.env` file in the root directory:
```env
VITE_APP_SUPABASE_URL=your_supabase_project_url
VITE_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```
Replace "your_supabase_project_url" and "your_supabase_anon_key" with your Supabase project url and your Supabase anonymous key, respectively.

6. **Run the Development Server**
```bash
npm run dev
```

7. **Building for Production**
```bash
npm run build
```

8. **Testing**
```bash
npm run test:unit
```

### Optional: Setting up Auth Providers

1. Go to Authentication > Providers in your Supabase dashboard
2. Enable and configure desired providers (Email, Google, GitHub, etc.)
3. Update the auth configuration in your application if needed

## Troubleshooting 🔍

Common issues and solutions:

1. **Database Connection Issues**
   - Verify your environment variables are correct
   - Check if your IP is allowlisted in Supabase
   - Ensure your database tables are properly set up

2. **Build Errors**
   - Clear your node_modules and package-lock.json
   - Run `npm install` again
   - Ensure you're using a compatible Node.js version

3. **Authentication Issues**
   - Check your Supabase authentication settings
   - Verify your API keys and URLs
   - Clear local storage and try again

## Contributing 🤝

1. Fork the repository
2. Create a new branch for your feature
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License 📄

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

The full license text can be found in the [LICENSE](LICENSE) file in the repository.

For more details about the GPL-3.0 license, visit:
https://www.gnu.org/licenses/gpl-3.0.en.html

## Support <img src="https://github.com/omegarhovega/ARRRType/blob/main/public/parrot_p.webp?raw=true" alt="parrot" width="20"/>

For support, please create an issue in the GitHub repository.

Start your typing adventure today and become the fastest typist in the seven seas! 🌊
