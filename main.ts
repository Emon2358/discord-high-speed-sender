import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

// ランダムな絵文字を生成する関数
function generateRandomEmojis(count: number): string {
  const emojis = [
    "😀", "😂", "😅", "😊", "😍", "😎", "😡", "😭", "😜", "😈", "🤖", "👻",
    "🎃", "💀", "🐱", "🐶", "🦊", "🐻", "🐼", "🐯", "🐨", "🐸", "🐧", "🐦",
    "🐤", "🐥", "🐝", "🦋", "🌸", "🌻", "🍀", "🌵", "🌴", "🍁", "🍄", "🔥", 
    "⚡", "💧", "✨", "🎉", "🎶", "🎵", "🥳", "🤩", "😎", "🙌", "👍", "👀"
  ];
  let result = "";
  for (let i = 0; i < count; i++) {
    result += emojis[Math.floor(Math.random() * emojis.length)];
  }
  return result;
}

// 高速メッセージ送信のためのループ
async function sendMessagesToChannels(token: string, channels: any[], message: string, loopCount: number) {
  const promises = [];

  for (let i = 0; i < loopCount; i++) {
    for (const channel of channels) {
      const fullMessage = `${message} ${generateRandomEmojis(100)}`;
      const promise = fetch(
        `https://discord.com/api/v10/channels/${channel.id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: fullMessage }),
        }
      );
      promises.push(promise);  // 並行処理のためにPromiseを追加
    }
  }

  // 全てのリクエストを並行して処理
  const results = await Promise.all(promises);

  // 各リクエストの結果を処理
  const responseData = results.map(async (res) => ({
    channelId: res.url,
    status: res.status,
    response: await res.json(),
  }));

  return await Promise.all(responseData);  // 結果を返す
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "POST" && request.url.endsWith("/api/discord/send")) {
    const { token, serverId, message, loopCount = 10 } = await request.json();
    
    // サーバー内のテキストチャンネルを取得する
    const channelsResponse = await fetch(
      `https://discord.com/api/v10/guilds/${serverId}/channels`,
      {
        method: "GET",
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    
    if (!channelsResponse.ok) {
      return new Response("Failed to fetch channels", { status: channelsResponse.status });
    }

    const channels = await channelsResponse.json();

    // テキストチャンネルをフィルタリング
    const textChannels = channels.filter((channel: any) => channel.type === 0);

    if (textChannels.length === 0) {
      return new Response("No text channels found in the server", { status: 404 });
    }

    // 並行・非同期でループ送信
    const result = await sendMessagesToChannels(token, textChannels, message, loopCount);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}

serve(handleRequest);
