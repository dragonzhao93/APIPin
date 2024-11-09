const SBY_API_URL = process.env.NEXT_PUBLIC_SBY_API_URL;

// 音乐服务
export const musicApi = {
  search: {
    wy: (term) => `${SBY_API_URL}/wydg/?msg=${term}`,
    qq: (term) => `${SBY_API_URL}/qqdg/?word=${term}`
  },
  getSongDetail: {
    wy: (term, index) => `${SBY_API_URL}/wydg/?msg=${term}&n=${index + 1}`,
    qq: (term, index, quality) => {
      let url = `${SBY_API_URL}/qqdg/?word=${term}&n=${index + 1}`;
      // 只有当用户选择了音质时才添加音质参数
      if (quality) url += `&q=${quality}`;
      return url;
    }
  }
};

// 可以添加其他服务
export const otherApi = {
  // 示例
  someEndpoint: (param) => `${SBY_API_URL}/other/?param=${param}`
};

// 统一的请求处理器
export async function fetchApi(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, options);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { success: false, error };
  }
}