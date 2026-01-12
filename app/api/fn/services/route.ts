import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("Mock API received request:", body);
  } catch (error) {
    console.error("Error reading request body:", error);
  }

  return NextResponse.json({
    "success": true,
    "entryToken": "mock-token-" + Math.random().toString(36).substring(7),
    "services": [
        {
            "title": "openlist",
            "url": "http://10.0.0.11:55244",
            "port": "55244",
            "alias": "openlist_55244"
        },
        {
            "title": "uptime-kuma",
            "url": "http://10.0.0.11:53001",
            "port": "53001",
            "alias": "uptime_kuma_53001",
            "clickable": true,
            "visible": true
        },
        {
            "title": "astrbot",
            "url": "http://10.0.0.11:56185",
            "port": "56185",
            "alias": "astrbot_56185",
            "clickable": false, // 测试不可点击
            "visible": true
        },
        {
            "title": "nginx-proxy-manager",
            "url": "http://10.0.0.11:58081",
            "port": "58081",
            "alias": "npm_58081"
        },
        {
            "title": "nginx-proxy-manager",
            "url": "http://10.0.0.11:50080",
            "port": "50080",
            "alias": "npm_50080"
        },
        {
            "title": "nginx-proxy-manager",
            "url": "http://10.0.0.11:50443",
            "port": "50443",
            "alias": "npm_50443"
        },
        {
            "title": "mortis",
            "url": "http://10.0.0.11:55231",
            "port": "55231",
            "alias": "mortis_55231"
        },
        {
            "title": "napcat",
            "url": "http://10.0.0.11:56099",
            "port": "56099",
            "alias": "napcat_56099"
        },
        {
            "title": "napcat",
            "url": "http://10.0.0.11:51300",
            "port": "51300",
            "alias": "napcat_51300"
        },
        {
            "title": "napcat",
            "url": "http://10.0.0.11:51301",
            "port": "51301",
            "alias": "napcat_51301"
        },
        {
            "title": "memos",
            "url": "http://10.0.0.11:55230",
            "port": "55230",
            "alias": "memos_55230"
        }
    ]
  });
}
