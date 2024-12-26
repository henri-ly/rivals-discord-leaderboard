import { AttachmentBuilder } from "discord.js";
import path from "path";
import { chromium } from "playwright";
import {
  compareRanks,
  compressImage,
  createLeaderboardEmbed,
  getURL,
  Player,
  setIds,
} from "../utils";

export const generateEmbedLeaderboard = async (ids: string[]) => {
  console.log({ ids });
  const promiseIds: Promise<Player | undefined>[] = ids.map(
    async (id) => await takeScreenshot(getURL(id), id)
  );

  const screenedPlayers = (await Promise.all(promiseIds)).filter(
    Boolean
  ) as Player[];

  screenedPlayers.sort(
    ({ rank: rankA, score: scoreA }, { rank: rankB, score: scoreB }) => {
      return compareRanks(rankA, scoreA, rankB, scoreB);
    }
  );

  await setIds(screenedPlayers.map(({ id }) => id));

  const files = screenedPlayers.map(({ path }) => {
    return new AttachmentBuilder(path);
  });

  const embed = createLeaderboardEmbed(screenedPlayers);

  return { files, embed };
};

export async function checkIfPlayerExist(id: string): Promise<boolean> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(getURL(id));
  const playerNotFound = page.getByText("Player not found");
  if (!(await playerNotFound.isVisible())) {
    await browser.close();
    return false;
  }
  await browser.close();
  return true;
}

async function takeScreenshot(
  url: string,
  id: string
): Promise<Player | undefined> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 400, height: 400 });
  const screenshotPath = path.join(__dirname, "../../screens", `${id}.png`);
  console.log(`Connecting to ${url} ...`);
  await page.goto(url);
  try {
    const rankedButton = page.getByRole("button", { name: "Competitive" });
    if (await rankedButton.isVisible()) {
      await rankedButton.click();
    }

    await page.waitForTimeout(1000);

    await page.locator("div.profile-overview>.left").first().screenshot({
      path: screenshotPath,
    });

    const name = await page
      .locator("div.profile-head .left .name")
      .first()
      .allTextContents();

    const rank = await page
      .locator("div.profile-overview>.left .rank-info>div.name")
      .allTextContents();
    const score = await page
      .locator("div.profile-overview>.left .rank-info>div.score")
      .allTextContents();

    const games = await page.locator("div.w-l").allTextContents();

    const mostPlayedHero = await page
      .locator("div.profile-overview>.left .hero")
      .first()
      .locator(".name")
      .allTextContents();

    await browser.close();
    console.log(`Screenshot taken for ${id}`);
    await compressImage(screenshotPath);
    return {
      rank: rank[0],
      path: `./screens/${id}_compressed.png`,
      name: name[0],
      id,
      score: score[0],
      games: games[0],
      mostPlayedHero: mostPlayedHero[0],
    };
  } catch (e) {
    console.log("FAILED TO TAKE SCREENSHOT OF :", url);
    await page.screenshot({
      path: screenshotPath,
    });
    throw e;
  }
}
