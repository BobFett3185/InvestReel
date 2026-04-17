const API_BASE = 'http://localhost:8080';
import { supabase } from './supabaseClient';

export async function fetchReels(page = 1, limit = 10) {
  const res = await fetch(`${API_BASE}/api/reels?page=${page}&limit=${limit}`);
  return res.json();
}

export async function fetchReel(id) {
  const res = await fetch(`${API_BASE}/api/reels/${id}`);
  return res.json();
}

export async function toggleLike(reelId, username = 'guest_user') {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/like?username=${username}`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchComments(reelId) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/comments`);
  return res.json();
}

export async function addComment(reelId, username, text) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, text }),
  });
  return res.json();
}

export async function investInReel(reelId, username, amount) {
  const res = await fetch(`${API_BASE}/api/reels/${reelId}/invest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, amount }),
  });
  return res.json();
}

export async function fetchMarket() {
  const { data: reelsData, error } = await supabase
    .from('reels')
    .select(`*, users (username, avatar_url)`)
    
  if (error) throw error

  const reels = reelsData.map(r => {
    let changePct = 0
    if (r.price_history && r.price_history.length >= 2) {
      const latest = r.price_history[r.price_history.length - 1].price
      const prev = r.price_history[r.price_history.length - 2].price
      changePct = prev ? (((latest - prev) / prev) * 100) : 0
    }

    return {
      id: r.id,
      username: r.users?.username,
      user_avatar: r.users?.avatar_url,
      thumbnail: '', // We don't have thumbnails for videos natively without FFmpeg, use empty string
      video_url: r.video_url,
      caption: r.caption,
      price: r.price || 10.00,
      investments: r.investments_count || 0,
      likes: r.like_count || 0,
      views: (r.like_count || 0) * 4,
      change_pct: changePct,
      price_history: (r.price_history || []).map(p => p.price)
    }
  })

  // Calculate top-level stats
  const totalMarketCap = reels.reduce((acc, r) => acc + (r.price * Math.max(1, r.investments)), 0)
  const totalVolume = reels.reduce((acc, r) => acc + r.investments, 0)
  
  return {
    stats: {
      total_market_cap: totalMarketCap,
      total_volume: totalVolume,
      total_reels: reels.length
    },
    reels
  }
}

export async function fetchUser(userId) {
  // Try to use true supabase Profile
  const { data: user, error } = await supabase.from('users').select('*').eq('id', userId).single()
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  // Get users reels if they made any
  const { data: reels } = await supabase.from('reels').select('*').eq('user_id', userId)
  
  // Calculate raw portfolio value from investments
  const { data: investments } = await supabase.from('investments').select('*, reels(price)').eq('user_id', userId)
  
  let portfolioValue = user.balance || 0
  let realInvestments = []
  
  if (investments) {
    investments.forEach(inv => {
      const currentPrice = inv.reels?.price || inv.buy_price
      portfolioValue += inv.shares_bought * currentPrice
      realInvestments.push({
        ...inv,
        current_value: inv.shares_bought * currentPrice,
        return_pct: ((currentPrice - inv.buy_price) / inv.buy_price) * 100
      })
    })
  }

  return {
    ...user,
    display_name: user.display_name || user.username,
    bio: user.bio || "Day trader & creator",
    followers: 0,
    following: 0,
    total_likes: reels?.reduce((acc, r) => acc + (r.like_count || 0), 0) || 0,
    portfolio_value: portfolioValue,
    avatar: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=fallback',
    reels: reels || [],
    investments: realInvestments
  }
}

// =====================================
// SUPABASE API METHODS 
// =====================================

export async function fetchFollowingReels(currentUserId) {
  // 1. Get IDs of users the current user is following
  const { data: followData, error: followError } = await supabase
    .from('follows')
    .select('following_id')
    .eq('follower_id', currentUserId);

  if (followError) throw followError;

  const followingIds = followData.map((f) => f.following_id);

  if (followingIds.length === 0) {
    return []; // Not following anyone
  }

  // 2. Fetch recent reels from those users, including author profile and like status
  const { data: reelsData, error: reelsError } = await supabase
    .from('reels')
    .select(`
      *,
      users!inner (username, avatar_url),
      likes!left (user_id)
    `)
    .in('user_id', followingIds)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reelsError) throw reelsError;

  return reelsData;
}

export async function fetchDiscoveryReels() {
  // Fetch recent random reels from the global pool (up to 20 for discovery)
  const { data: reelsData, error: reelsError } = await supabase
    .from('reels')
    .select(`
      *,
      users!inner (username, avatar_url),
      likes!left (user_id)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  if (reelsError) throw reelsError;
  return reelsData;
}

// =====================================
// FRIEND & SOCIAL METHODS
// =====================================

export async function searchUsers(query, limit = 10) {
  if (!query) return []
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .ilike('username', `%${query}%`)
    .limit(limit)

  if (error) throw error
  return data
}

export async function fetchSuggestedFriends(currentUserId, limit = 5) {
  // 1. Get who we already follow
  const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId)
  const followingIds = follows ? follows.map(f => f.following_id) : []
  
  // 2. We don't want to show ourselves or people we already follow
  const excludeIds = [currentUserId, ...followingIds]

  // Ideally this is a random sample, but for simplicity we get latest active or limit
  // Supabase REST lacks random order by default without RPC, so we just filter
  const { data, error } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(limit)

  if (error) throw error
  return data
}

export async function fetchMyFollows(currentUserId) {
  const { data, error } = await supabase.from('follows').select('following_id').eq('follower_id', currentUserId)
  if (error) throw error
  return data ? data.map(f => f.following_id) : []
}

export async function toggleFollow(followerId, followingId, currentlyFollowing) {
  if (currentlyFollowing) {
    const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
    if (error) throw error
    return false
  } else {
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
    if (error) throw error
    return true
  }
}

// =====================================
// LIKE METHODS
// =====================================

export async function toggleSupabaseLike(userId, reelId, currentlyLiked) {
  if (currentlyLiked) {
    // Delete like
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('reel_id', reelId);
    
    // Decrement reel count
    const { data: reel } = await supabase.from('reels').select('like_count').eq('id', reelId).single();
    if (reel) {
       await supabase.from('reels').update({ like_count: Math.max(0, reel.like_count - 1) }).eq('id', reelId);
    }
    
    if (error) throw error;
    return false;
  } else {
    // Insert like
    const { error } = await supabase
      .from('likes')
      .insert({ user_id: userId, reel_id: reelId });
    
    // Increment reel count
    const { data: reel } = await supabase.from('reels').select('like_count').eq('id', reelId).single();
    if (reel) {
       await supabase.from('reels').update({ like_count: reel.like_count + 1 }).eq('id', reelId);
    }

    if (error && error.code !== '23505') throw error; // Ignore unique violation if already liked
    return true;
  }
}

// =====================================
// INVESTMENT & MARKET METHODS
// =====================================

export async function fetchUserBalance(userId) {
  let { data, error } = await supabase.from('users').select('balance').eq('id', userId).single()
  
  // If the user's profile doesn't exist in public.users yet (created early or missed Auth hook)
  if (error && error.code === 'PGRST116') {
    console.log("Profile not found, initializing public user table row with default balance...")
    const { data: insertData, error: insertError } = await supabase.from('users').insert({
      id: userId,
      username: `user_${userId.substring(0, 5)}`,
      display_name: `User ${userId.substring(0, 5)}`,
      balance: 100.00
    }).select().single()
    
    if (insertError) throw insertError
    return insertData.balance
  }
  
  if (error) throw error
  return data?.balance || 0
}

export async function executeInvestment(userId, reelId, amountInvested) {
  // We'll perform a multi-step sequential operation here. 
  // In a production app, use an edge function/RPC for ACID transactions.
  
  // 1. Get user and check balance
  const { data: user, error: userError } = await supabase.from('users').select('balance').eq('id', userId).single()
  if (userError) throw userError
  if (user.balance < amountInvested) throw new Error("Insufficient funds")

  // 2. Get current reel details
  const { data: reel, error: reelError } = await supabase.from('reels').select('price, investments_count, price_history').eq('id', reelId).single()
  if (reelError) throw reelError

  const currentPrice = reel.price || 10.00
  const sharesBought = amountInvested / currentPrice
  
  // New price simple calculation: goes up by a small fraction depending on investment size
  const newPrice = currentPrice + (amountInvested * 0.005)
  const newHistory = [...(reel.price_history || []), { timestamp: new Date().toISOString(), price: newPrice }]

  // 3. Deduct balance
  await supabase.from('users').update({ balance: user.balance - amountInvested }).eq('id', userId)

  // 4. Create investment record
  await supabase.from('investments').insert({
    user_id: userId,
    reel_id: reelId,
    amount_invested: amountInvested,
    shares_bought: sharesBought,
    buy_price: currentPrice
  })

  // 5. Update reel
  await supabase.from('reels').update({
    price: newPrice,
    investments_count: (reel.investments_count || 0) + 1,
    price_history: newHistory
  }).eq('id', reelId)

  return { new_price: newPrice, shares_bought: sharesBought }
}

export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
