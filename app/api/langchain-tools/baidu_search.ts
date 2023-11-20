import { decode } from "html-entities";
import { convert as htmlToText } from "html-to-text";
import { Tool } from "langchain/tools";
import * as cheerio from "cheerio";
import { getRandomUserAgent } from "./ua_tools";

interface SearchResults {
  /** The web results of the search. */
  results: SearchResult[];
}

interface SearchResult {
  /** The URL of the result. */
  url: string;
  /** The title of the result. */
  title: string;
  /**
   * The sanitized description of the result.
   * Bold tags will still be present in this string.
   */
  description: string;
}

async function search(
  input: string,
  maxResults: number,
): Promise<SearchResults> {
  const results: SearchResults = {
    results: [],
  };
  const headers = new Headers();
  headers.append("User-Agent", getRandomUserAgent());
  headers.append("Accept", 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9');
  headers.append("Cookie", 'BIDUPSID=7622D3428FFDB547E559E7820E6F4066; PSTM=1689957441; BD_UPN=12314753; BAIDUID=7622D3428FFDB547150D21F524FCE943:SL=0:NR=10:FG=1; hide_hotsearch=1; H_WISE_SIDS=216853_213347_214797_110085_244721_254833_261712_236312_256419_265881_266362_267066_265615_268450_268565_268593_268030_265986_259642_269779_269832_269749_269905_270084_256739_270460_270535_264424_270547_270917_271054_271020_271170_271178_269771_269730_271226_267659_265032_271271_265825_271482_266027_271579_271359_270102_271562_270443_271879_270158_271813_269875_267547_271938_271954_269289_256151_234295_234208_271187_272227_270055_272284_267596_272366_272008_253022_272077_272830_272817_272837_272802_270142_260335_269296_272768_269715_273060_267560_273094_273161_273164_273154_273134_273242_273300_272495_273399_273389_271157_273323_273521_270179_271146_273703_264170_270186_273735_263619_274077_273931_273965_274141_269609_273917_274237_273785_273045_272689_263749_272805_274356_272319_188333; H_WISE_SIDS_BFESS=216853_213347_214797_110085_244721_254833_261712_236312_256419_265881_266362_267066_265615_268450_268565_268593_268030_265986_259642_269779_269832_269749_269905_270084_256739_270460_270535_264424_270547_270917_271054_271020_271170_271178_269771_269730_271226_267659_265032_271271_265825_271482_266027_271579_271359_270102_271562_270443_271879_270158_271813_269875_267547_271938_271954_269289_256151_234295_234208_271187_272227_270055_272284_267596_272366_272008_253022_272077_272830_272817_272837_272802_270142_260335_269296_272768_269715_273060_267560_273094_273161_273164_273154_273134_273242_273300_272495_273399_273389_271157_273323_273521_270179_271146_273703_264170_270186_273735_263619_274077_273931_273965_274141_269609_273917_274237_273785_273045_272689_263749_272805_274356_272319_188333; BDORZ=B490B5EBF6F3CD402E515D22BCDA1598; newlogin=1; ispeed_lsm=2; BDUSS=p-Yi1UUjdPbE9CTUx3LWd0MG9aak53bjgwZlNsaGVMR3ZnYmk5TX5xM3ZXMmRsSVFBQUFBJCQAAAAAAAAAAAEAAAB6UW5qeGJzem1tbW1tAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO~OP2Xvzj9lZm; BDUSS_BFESS=p-Yi1UUjdPbE9CTUx3LWd0MG9aak53bjgwZlNsaGVMR3ZnYmk5TX5xM3ZXMmRsSVFBQUFBJCQAAAAAAAAAAAEAAAB6UW5qeGJzem1tbW1tAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAO~OP2Xvzj9lZm; MCITY=-132%3A; H_PS_PSSID=39633_39648_39668_39663_39680_39694_39676_39679_39713_39733_39738; sug=0; sugstore=0; ORIGIN=0; bdime=0; BA_HECTOR=81252484252la0agah0g8g2g1ilc9ck1q; BDRCVFR[feWj1Vr5u3D]=I67x6TjHwwYf0; delPer=0; BD_CK_SAM=1; PSINO=7; BAIDUID_BFESS=7622D3428FFDB547150D21F524FCE943:SL=0:NR=10:FG=1; ZFY=BGzd:BadmlvL8w6O8sI4MQin0mV7iNQAPoc0Vk26qCpo:C; H_PS_645EC=54ffCzY5xNXYlNcEjrIDaf8jJ7dtbkTEkW9%2FzE8N75lRYQKR0JbzxIGlNFSR5t0vyOID');
  const resp = await fetch(
    `http://www.baidu.com/s?f=8&ie=utf-8&rn=${maxResults}&wd=${encodeURIComponent(
      input,
    )}`,
    {
      headers: headers,
    },
  );
  const respText = await resp.text();
  console.log(respText);  // 打印获取的网页数据
  const respCheerio = cheerio.load(respText);
  respCheerio("div.c-container.new-pmd").each((i, elem) => {
    const item = cheerio.load(elem);
    const linkElement = item("a");
    const url = (linkElement.attr("href") ?? "").trim();
    if (url !== "" && url !== "#") {
      const title = decode(linkElement.text());
      const description = item.text().replace(title, "").trim();
      results.results.push({
        url,
        title,
        description,
      });
    }
  });
  return results;
}

export class BaiduSearch extends Tool {
  name = "baidu_search";
  maxResults = 8;

  /** @ignore */
  async _call(input: string) {
    const searchResults = await search(input, this.maxResults);

    if (searchResults.results.length === 0) {
      return "No good search result found";
    }

    const results = searchResults.results
      .slice(0, this.maxResults)
      .map(({ title, description, url }) => htmlToText(description))
      .join("\n\n");
    return results;
  }

  description =
    "a search engine. useful for when you need to answer questions about current events. input should be a search query.";
}
