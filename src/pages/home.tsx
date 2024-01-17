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
                // return new response for assistant after message from user
                {
                  role: "assistant",
                  content: "",
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
                    stream: true,
                  }),
                }
              );

              //   Print response.text() to console
              //   const returnText = await response.text();
              //   console.log(returnText);

              if (!response.body) return;
              const reader = response.body?.getReader();
              const decoder = new TextDecoder();

              let isFinished = false;
              while (!isFinished) {
                const { done, value } = await reader.read();
                isFinished = done;

                const decodedValue = decoder.decode(value);
                console.log(decodedValue);
                if (!decodedValue) break;

                const messages = decodedValue.split("\n\n");
                // console.log(messages);

                const chuncks = messages
                  .filter((msg) => msg && msg != "data: [DONE]")
                  .map((message) =>
                    JSON.parse(message.replace(/^data:/g, "").trim())
                  );
                // console.log(chuncks)

                for (const chunck of chuncks) {
                  const content = chunck.choices[0].delta.content;
                  console.log(chunck.choices[0].delta.content);
                  if (content) {
                    setMessages((messages: Messages) => [
                      ...messages.slice(0, messages.length - 1),
                      {
                        role: "assistant",
                        content: `${
                          messages[messages.length - 1].content
                        }${content}`,
                      },
                    ]);
                  }
                }
              }
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
                <br />
                <br />
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
