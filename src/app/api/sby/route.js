import { NextResponse } from 'next/server';

const SBY_API_URL = process.env.NEXT_PUBLIC_SBY_API_URL;

// 统一的错误处理
function handleError(error) {
  console.error('API Error:', error);
  return NextResponse.json(
    { success: false, error: error.message },
    { status: 500 }
  );
}

// 统一的请求处理
async function handleRequest(requestUrl) {
  try {
    const response = await fetch(requestUrl);
    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleError(error);
  }
}

// GET 处理器
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform');
  const term = searchParams.get('term');
  const index = searchParams.get('index');
  const quality = searchParams.get('quality');

  // 加强参数验证
  if (!platform || !['qq', 'wy'].includes(platform)) {
    return NextResponse.json(
      { success: false, error: 'Invalid platform parameter' },
      { status: 400 }
    );
  }

  if (!term || term.trim() === '') {
    return NextResponse.json(
      { success: false, error: 'Invalid search term' },
      { status: 400 }
    );
  }

  if (index !== null && (isNaN(index) || index < 0)) {
    return NextResponse.json(
      { success: false, error: 'Invalid index parameter' },
      { status: 400 }
    );
  }

  let requestUrl;
  if (index !== null) {
    // 获取歌曲详情
    requestUrl = platform === 'qq' 
      ? `${SBY_API_URL}/qqdg/?word=${term}&n=${Number(index) + 1}${quality ? `&q=${quality}` : ''}`
      : `${SBY_API_URL}/wydg/?msg=${term}&n=${Number(index) + 1}`;
  } else {
    // 搜索歌曲
    requestUrl = platform === 'qq'
      ? `${SBY_API_URL}/qqdg/?word=${term}`
      : `${SBY_API_URL}/wydg/?msg=${term}`;
  }

  return handleRequest(requestUrl);
} 