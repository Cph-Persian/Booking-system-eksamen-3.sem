# Guide til Supabase Auth Implementering

## Oversigt
Systemet er nu klar til at implementere Supabase authentication. Der er to typer brugere:
- **Studerende**: Kan kun booke møde lokaler
- **Lærer**: Kan booke både møde lokaler og klasse lokaler

## Filer der skal opdateres

### 1. Supabase Database Setup

Opret en `users` tabel i Supabase med følgende struktur:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('studerende', 'lærer')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. UserContext.tsx

I `app/contexts/UserContext.tsx` skal du:

1. **Erstatte mock data i useEffect** med Supabase auth check:
```typescript
useEffect(() => {
  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const userData = await fetchUserData(session.user.id);
      setUser(userData);
    }
    setLoading(false);
  };
  
  checkUser();
  
  // Lyt til auth state changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        setUser(userData);
      } else {
        setUser(null);
      }
    }
  );
  
  return () => subscription.unsubscribe();
}, []);
```

2. **Implementer fetchUserData funktionen** (fjern TODO kommentaren):
```typescript
async function fetchUserData(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  
  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatarUrl: data.avatar_url,
    userType: data.user_type as UserType,
  };
}
```

3. **Implementer login funktionen**:
```typescript
const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  if (data.user) {
    const userData = await fetchUserData(data.user.id);
    setUser(userData);
  }
};
```

4. **Implementer logout funktionen**:
```typescript
const logout = async () => {
  await supabase.auth.signOut();
  setUser(null);
};
```

### 3. Login Side

Opret en login side i `app/login/page.tsx` der bruger `useUser()` hook til at logge ind.

### 4. Row Level Security (RLS) i Supabase

Sørg for at sætte RLS policies op i Supabase:
- Brugere kan kun se deres egne bookinger
- Studerende kan kun booke møde lokaler
- Lærere kan booke både møde og klasse lokaler

## Test

Når implementeret, kan du teste med:
- Mock data er sat til "Amy Horsefighter" som studerende
- Skift `userType: 'studerende'` til `userType: 'lærer'` i UserContext.tsx for at teste lærer funktionalitet

