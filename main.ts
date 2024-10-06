import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response(await Deno.readTextFile("index.html"), {
      headers: { "Content-Type": "text/html" },
    });
  } else if (
    request.method === "POST" &&
    request.url.endsWith("/api/discord")
  ) {
    const { token } = await request.json();
    const discordResponse = await fetch(
      "https://discordapp.com/api/users/@me",
      {
        headers: {
          Authorization: `${token}`,
        },
      }
    );
    const userData = await discordResponse.json();
    return new Response(JSON.stringify(userData), {
      headers: { "Content-Type": "application/json" },
    });
  } else if (
    request.method === "POST" &&
    request.url.endsWith("/api/discord/send")
  ) {
    const { token, channelId, message } = await request.json();
    const discordResponse = await fetch(
      `https://discordapp.com/api/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      }
    );
    const responseData = await discordResponse.json();
    return new Response(JSON.stringify(responseData), {
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response("Not Found", { status: 404 });
}

serve(handleRequest);
