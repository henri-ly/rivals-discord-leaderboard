import fs from "fs";
import { idsFilePath, setIds } from "../utils";

export async function removeById(id: string): Promise<void> {
  let ids: string[] = [];
  if (fs.existsSync(idsFilePath)) {
    const data = fs.readFileSync(idsFilePath, "utf-8");
    ids = JSON.parse(data);
  }
  ids = ids.filter((i) => i !== id);
  console.log("id remove", id);

  setIds(ids);
}
