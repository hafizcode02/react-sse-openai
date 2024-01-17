import { useState } from "react";

type Messages = { role: "system" | "user" | "assistant"; content: string }[];
export default function Home() {
  const [messages, setMessages] = useState<
    { role: "system" | "user" | "assistant"; content: string }[]
  >([
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
  ]);
  return (
    <div>
      <div className="container mx-auto">
        <div className="card sm:w-96 md:w-2/3 lg:w-1/2 mx-auto">
          <h1 className="text-2xl font-bold mx-auto my-4">OpenAI CHAT</h1>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = Object.fromEntries(formData.entries());

              setMessages((messages: Messages) => [
                ...messages,
                {
                  role: "user",
                  content: data.content as string,
                },
              ]);

              const response = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization:
                      "Bearer " + import.meta.env.VITE_OPENAI_API_KEY,
                  },
                  body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                      {
                        role: "system",
                        content: "You are a helpful assistant.",
                      },
                      {
                        role: "user",
                        content: data.content,
                      },
                    ],
                  }),
                }
              );
              const json = await response.json();
              console.log(json);
              setMessages((messages: Messages) => [
                ...messages,
                {
                  role: "assistant",
                  content: json.choices[0].message.content,
                },
              ]);
            }}
          >
            <div className="form-control">
              <label htmlFor="content" className="my-2">
                <span className="label-text text-base font-medium">
                  Content :
                </span>
              </label>
              <textarea
                required
                name="content"
                rows={3}
                className="textarea textarea-bordered rounded-md"
              ></textarea>
            </div>
            <div className="form-control mt-4">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
            </div>
          </form>
          <br />

          <div className="card">
            {messages?.map((message, index) => (
              <p key={index}>
                {message.role.charAt(0).toUpperCase() + message.role.slice(1)} :{" "}
                {message.content}
                <br /><br />
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
