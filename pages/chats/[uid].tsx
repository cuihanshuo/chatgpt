import {
  ChatBubbleLeftRightIcon,
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/router";
import React, { useContext, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Button from "../../components/Button";
import Layout from "../../components/Layout";
import Markdown from "../../components/Markdown";
import { MyChatGPTContext } from "../../contexts/MyChatGPTContext";
import { wrappedWriteClipboard } from "../../utils";

export default function ChatPage() {
  const router = useRouter();
  const { uid } = router.query;
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [submitDisabled, setSubmitDisabled] = useState(false);
  const { state, dispatch } = useContext(MyChatGPTContext);
  const chatListTop = useRef(null);
  const chatListBottom = useRef(null);

  function scrollDown() {
    chatListBottom.current.scrollIntoView({
      behavior: "smooth",
      alignToTop: false,
    });
  }

  function scrollUp() {
    chatListTop.current.scrollIntoView({
      behavior: "smooth",
      alignToTop: true,
    });
  }

  useEffect(() => {
    setHistory(JSON.parse(localStorage.getItem(uid as string) || "[]"));
  }, [uid]);

  useEffect(() => {
    scrollDown();
  }, [history]);

  async function handleSubmit() {
    setSubmitDisabled(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input,
          history,
          temperature: state.temperature,
        }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw (
          data.error ||
          new Error(`Request failed with status ${response.status}`)
        );
      }

      const newHistory = [
        ...history,
        { role: "user", content: input },
        { role: "assistant", content: data.result },
      ];
      setHistory(newHistory);
      localStorage.setItem(uid as string, JSON.stringify(newHistory));
      setInput("");
    } catch (error) {
      // Consider implementing your own error handling logic here
      console.error(error);
      alert(error.message);
    }

    setSubmitDisabled(false);
  }

  async function handleKeyDown(e) {
    if (e.keyCode == 13 && e.shiftKey) {
      e.preventDefault();
      await handleSubmit();
    }
  }

  async function handleExport() {
    const historyText = history
      .map(
        (x, index) =>
          (x.role === "assistant" ? "A" : "Q") +
          (Math.floor(index / 2) + 1) +
          ": " +
          x.content
      )
      .join("\n");
    await wrappedWriteClipboard(historyText);
    alert("????????????");
  }

  async function onSubmit(event) {
    event.preventDefault();
    await handleSubmit();
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-128px)] flex-col justify-between gap-5">
        <div className="grow overflow-auto">
          <div className="flex flex-col justify-center gap-2">
            <div key="chat-list-top" ref={chatListTop}></div>
            {Array.from({ length: history.length / 2 }).map((_, index) => (
              <div key={uid + "-d-" + index.toString()}>
                <Markdown
                  className="p-2"
                  key={uid + "-" + (index * 2).toString()}
                  children={history[index * 2].content}
                />
                <Markdown
                  className="rounded-md bg-indigo-200 p-2 leading-relaxed dark:bg-slate-600"
                  key={uid + "-" + (index * 2 + 1).toString()}
                  children={history[index * 2 + 1].content}
                />
              </div>
            ))}
            <div key="chat-list-bottom" ref={chatListBottom}></div>
          </div>
        </div>
        <div className="md-0 pd-0 flex flex-col items-center justify-center gap-2 md:flex-row">
          <textarea
            rows={3}
            name="input"
            placeholder="??????????????????Shift+?????????????????????"
            value={input}
            className="h-full w-full rounded-md border-2 border-double border-slate-400 bg-indigo-200 dark:bg-slate-600 md:basis-[7/8]"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e)}
          />
          <div className="margin-2 flex basis-1/5 items-center justify-center gap-2">
            <Button
              onClick={onSubmit}
              className="flex items-center justify-center"
              title="?????????????????????????????????ChatGPT"
              disabled={submitDisabled}
            >
              <PaperAirplaneIcon
                className="h-6 text-indigo-300"
                aria-hidden="true"
              />
            </Button>
            <Button
              className="absolute bottom-[70vh] right-5 bg-transparent shadow-none"
              onClick={scrollUp}
              title="???????????????"
            >
              <ChevronDoubleUpIcon
                className="h-6 text-indigo-300"
                aria-hidden="true"
              />
            </Button>
            <Button
              className="absolute bottom-[30vh] right-5 bg-transparent shadow-none"
              onClick={scrollDown}
              title="???????????????"
            >
              <ChevronDoubleDownIcon
                className="h-6 text-indigo-300"
                aria-hidden="true"
              />
            </Button>
            <Button
              onClick={handleExport}
              title="????????????????????????????????????????????????"
            >
              <ClipboardDocumentIcon
                className="h-6 text-indigo-300"
                aria-hidden="true"
              />
            </Button>
            <Button
              onClick={() => {
                const newId = uuidv4();
                dispatch({ type: "create", chatId: newId });
                router.push(`/chats/${newId}`);
              }}
              className="lg:hidden"
              title="?????????????????????????????????????????????????????????"
            >
              <ChatBubbleLeftRightIcon
                className="h-6 text-indigo-300"
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
