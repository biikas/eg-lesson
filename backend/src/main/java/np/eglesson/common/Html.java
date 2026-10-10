package np.eglesson.common;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.safety.Safelist;

/** Cleans editor HTML before storing it; the student site renders it with innerHTML. */
public final class Html {
  private static final Safelist SAFE = Safelist.relaxed()
      .addTags("span", "hr", "iframe", "figure", "figcaption", "mark", "s", "del", "ins")
      .addAttributes(":all", "class", "style", "id")
      .addAttributes("span", "data-value", "contenteditable")
      .addAttributes("pre", "spellcheck", "data-language")
      .addAttributes("li", "data-list")
      .addAttributes("iframe", "src", "frameborder", "allowfullscreen", "width", "height")
      .addAttributes("a", "target", "rel")
      .addAttributes("img", "loading", "width", "height")
      .addProtocols("img", "src", "http", "https", "data")
      .preserveRelativeLinks(true);

  private Html() {}

  public static String clean(String html) {
    if (html == null || html.isBlank()) return "";
    String cleaned = Jsoup.clean(html, "http://local.invalid/", SAFE);
    Document doc = Jsoup.parseBodyFragment(cleaned);
    for (Element frame : doc.select("iframe")) {
      String src = frame.attr("src");
      if (!(src.startsWith("https://www.youtube.com/embed/") || src.startsWith("https://www.youtube-nocookie.com/embed/")
          || src.startsWith("https://player.vimeo.com/video/"))) {
        frame.remove();
      }
    }
    for (Element style : doc.select("[style]")) {
      if (style.attr("style").toLowerCase().contains("url(") || style.attr("style").toLowerCase().contains("expression")) {
        style.removeAttr("style");
      }
    }
    for (Element a : doc.select("a[target=_blank]")) a.attr("rel", "noopener noreferrer");
    return doc.body().html();
  }

  public static String text(String html) {
    if (html == null) return "";
    return Jsoup.parse(html).text();
  }
}
