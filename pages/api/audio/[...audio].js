import nextConnect from "next-connect";
import audioRoutes from "@/routes/audioRoutes";

const handler = nextConnect();

handler.use((req, res, next) => {
  // adapt Express router
  audioRoutes(req, res, next);
});

export default handler;

export const config = {
  api: { bodyParser: false },
};
