import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const playlistsDir = path.join(process.cwd(), 'public/music');
    const files = await fs.readdir(playlistsDir);
    
    let comments = [];
    try {
      const commentContent = await fs.readFile(path.join(playlistsDir, 'rkpin.md'), 'utf8');
      const sections = commentContent.split('\n# ');
      sections.forEach(section => {
        if (section.trim()) {
          const [title, ...content] = section.split('\n');
          comments.push({
            title: title.replace('# ', ''),
            content: content.join('\n').trim()
          });
        }
      });
    } catch (error) {
      console.error('Error reading comments:', error);
    }
    
    const playlists = {};
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(playlistsDir, file), 'utf8');
        const playlistName = path.basename(file, '.json');
        const songs = JSON.parse(content);
        
        const sortedSongs = songs.sort((a, b) => {
          const aIndex = comments.findIndex(c => 
            hasCommonSubstring(a.name, c.title)
          );
          const bIndex = comments.findIndex(c => 
            hasCommonSubstring(b.name, c.title)
          );
          
          if (aIndex === -1 && bIndex === -1) return 0;
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        
        sortedSongs.forEach(song => {
          const matchedComment = comments.find(c => 
            hasCommonSubstring(song.name, c.title)
          );
          if (matchedComment) {
            song.comment = matchedComment.content;
          }
        });
        
        playlists[playlistName] = sortedSongs;
      }
    }
    
    return Response.json(playlists);
  } catch (error) {
    console.error('Error reading playlists:', error);
    return Response.json({ error: 'Failed to load playlists' }, { status: 500 });
  }
}

function hasCommonSubstring(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();
  return str1.includes(str2) || str2.includes(str1) || 
         str1.split(' ').some(word => str2.includes(word)) ||
         str2.split(' ').some(word => str1.includes(word));
} 