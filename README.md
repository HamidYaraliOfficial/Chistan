<div align="center">

# چیستان · Chistan

**بازی جدول کلمات متقاطع فارسی و انگلیسی، با جدول‌های تصادفی و بدون تکرار**
**A bilingual Persian and English crossword game with random, never-repeating puzzles**

[فارسی](#fa) &nbsp;|&nbsp; [English](#en)

<img src="docs/game-fa.png" alt="Chistan, Persian puzzle on desktop" width="720">

</div>

---

<a id="fa"></a>

<div dir="rtl">

# فارسی

«چیستان» یک بازی جدول کلمات متقاطع است که کاملاً در مرورگر اجرا می‌شود. هر جدول یک شبکهٔ کلمات به‌هم‌پیوسته است. سرنخ‌های افقی و عمودی را می‌خوانید و پاسخ را حرف‌به‌حرف در خانه‌ها می‌نویسید. بازی به دو زبان فارسی (راست‌به‌چپ) و انگلیسی (چپ‌به‌راست) کار می‌کند و هیچ وابستگی یا مرحلهٔ ساخت (build) ندارد.

## ویژگی‌ها

- **۲۰ مرحله از کوچک تا بزرگ.** از جدول ۶×۶ با ۴ کلمه تا جدول ۲۱×۲۱ با ۳۲ کلمه، در پنج دستهٔ مینی، کوچک، متوسط، بزرگ و غول‌پیکر.
- **تولید تصادفی و بی‌پایان.** با هر شروع مرحله یک جدول تازه ساخته می‌شود، پس هر مرحله به‌جای یک جدول ثابت، تعداد نامحدودی جدول دارد.
- **بدون تکرار.** بازی کلمه‌های اخیر و امضای چیدمان جدول‌های قبلی را در مرورگر شما نگه می‌دارد و از تکرار آن‌ها پرهیز می‌کند. در آزمایش ۱۲۰ جدول پشت‌سرهم برای هر زبان، هیچ جدول تکراری ساخته نشد و دو جدول متوالی به‌طور میانگین فقط حدود ۱ تا ۲ درصد کلمه‌هایشان مشترک بود.
- **هر دو زبان.** بانک واژگان فارسی و انگلیسی (هرکدام بیش از ۳۰۰ کلمه با سرنخ) و کیبورد مجازی مخصوص هر زبان. در حالت فارسی، اگر کیبورد دستگاه انگلیسی باشد، کلیدها به چیدمان استاندارد فارسی تبدیل می‌شوند.
- **ابزار کمکی.** بررسی خانه‌های اشتباه، نمایش یک حرف، نمایش یک کلمه، پاک کردن، نمایش پاسخ کامل.
- **ذخیرهٔ خودکار.** بازی نیمه‌کاره، زمان، بهترین رکورد هر مرحله و پیشرفت شما در مرورگر ذخیره می‌شود (به تفکیک زبان).
- **رابط زیبا و واکنش‌گرا.** طراحی با الهام از کاشی‌کاری ایرانی، پوستهٔ روشن و تیره، فونت‌های فارسی داخل پروژه (کار آفلاین هم می‌کند)، مناسب موبایل و دسکتاپ.
- **دسترس‌پذیر.** کار با کیبورد، فوکوس مشخص، پشتیبانی از `prefers-reduced-motion`.

<table>
  <tr>
    <td><img src="docs/home-fa.png" alt="Level selection" width="360"></td>
    <td><img src="docs/game-en-dark.png" alt="English puzzle, dark theme" width="360"></td>
    <td><img src="docs/mobile-fa.png" alt="Mobile layout" width="160"></td>
  </tr>
</table>

## اجرا

ساده‌ترین راه: فایل `index.html` را در مرورگر باز کنید.

یا با یک سرور محلی کوچک (نیاز به Node.js نسخهٔ ۱۶ به بالا):

```bash
git clone https://github.com/<your-user>/chistan-crossword.git
cd chistan-crossword
npm start            # سپس http://localhost:8080 را در مرورگر باز کنید
```

### انتشار روی GitHub Pages

۱. پروژه را روی GitHub push کنید.
۲. در مخزن به **Settings ← Pages** بروید.
۳. در بخش Source گزینهٔ **Deploy from a branch** را انتخاب کنید، شاخهٔ `main` و پوشهٔ `/ (root)` را بزنید و ذخیره کنید.
۴. بعد از چند دقیقه بازی در `https://<your-user>.github.io/chistan-crossword/` در دسترس است.

## راهنمای بازی

| کار | روش |
|---|---|
| انتخاب خانه | کلیک یا لمس خانه |
| تغییر جهت (افقی/عمودی) | دوباره روی همان خانه بزنید، یا کلید `Space` |
| وارد کردن حرف | کیبورد صفحه یا کیبورد دستگاه |
| حذف حرف | `Backspace` یا دکمهٔ حذف روی کیبورد صفحه |
| حرکت بین خانه‌ها | کلیدهای جهت‌دار |
| سرنخ بعدی / قبلی | `Enter` / `Shift`+`Enter` |
| رفتن به یک سرنخ | کلیک روی آن در فهرست سرنخ‌ها |

نکته: «نمایش حرف» و «نمایش کلمه» در رکورد زمان ثبت می‌شوند و جدولی که با کمک حل شود، رکورد جدید ثبت نمی‌کند. «نمایش پاسخ» جدول را در پیشرفت شما حل‌شده حساب نمی‌کند.

## مرحله‌ها

| دسته | مرحله | اندازهٔ حداکثر جدول | تعداد کلمه |
|---|---|---|---|
| مینی | ۱ تا ۴ | ۶×۶ تا ۸×۸ | ۴ تا ۷ |
| کوچک | ۵ تا ۸ | ۹×۹ تا ۱۱×۱۱ | ۸ تا ۱۱ |
| متوسط | ۹ تا ۱۲ | ۱۱×۱۱ تا ۱۳×۱۳ | ۱۲ تا ۱۵ |
| بزرگ | ۱۳ تا ۱۶ | ۱۴×۱۴ تا ۱۶×۱۶ | ۱۷ تا ۲۲ |
| غول‌پیکر | ۱۷ تا ۲۰ | ۱۷×۱۷ تا ۲۱×۲۱ | ۲۴ تا ۳۲ |

جدول ساخته‌شده همیشه به‌اندازهٔ کلمه‌های خودش جمع‌وجور می‌شود، پس ابعاد واقعی ممکن است کمی از این سقف کمتر باشد. جزئیات هر مرحله در آرایهٔ `LEVELS` داخل `js/generator.js` است.

## تولید جدول چطور کار می‌کند؟

۱. یک عدد تصادفی (seed) با `crypto.getRandomValues` انتخاب می‌شود و تولیدکنندهٔ اعداد شبه‌تصادفی `mulberry32` از آن ساخته می‌شود. با یک seed ثابت، همیشه همان جدول ساخته می‌شود و این برای تست و بازتولید جدول‌ها مفید است.
۲. کلمه‌های مناسب مرحله (بر اساس طول) از بانک واژگان جدا می‌شوند. کلمه‌هایی که اخیراً استفاده شده‌اند در انتهای صف می‌روند.
۳. یک کلمهٔ بلند نزدیک مرکز گذاشته می‌شود و بقیه یکی‌یکی به‌صورت متقاطع اضافه می‌شوند. هر گزینهٔ چیدمان فقط وقتی پذیرفته می‌شود که با هیچ کلمهٔ دیگری کنار هم نچسبد و فقط در نقطهٔ تقاطع‌های درست حرف مشترک داشته باشد.
۴. این کار چند بار با ترتیب متفاوت تکرار می‌شود و بهترین نتیجه (رسیدن به تعداد کلمهٔ هدف، تقاطع بیشتر، جدول جمع‌وجور و نزدیک به مربع) انتخاب می‌شود.
۵. اگر امضای جدول (هش FNV-1a از کلمه‌ها و جایگاه‌هایشان) قبلاً دیده شده باشد، جدول دوباره ساخته می‌شود.
۶. تابع `validate` جدول نهایی را مستقل بازبینی می‌کند: حرف‌ها، مرزها، هم‌پیوستگی و نبودن کلمهٔ ناخواسته.

روی یک رایانهٔ رومیزی، تولید حتی بزرگ‌ترین مرحله در آزمون ما کمتر از ۵۰ میلی‌ثانیه طول کشید (روی گوشی‌های قدیمی‌تر ممکن است کمی بیشتر باشد).

## افزودن کلمه و سرنخ

فایل‌های `js/words-fa.js` و `js/words-en.js` فهرستی از جفت‌های `[پاسخ, سرنخ]` هستند:

```js
['شیراز', 'شهر حافظ و سعدی'],   // js/words-fa.js
['TIGER', 'Big striped cat'],    // js/words-en.js
```

قواعد:

- پاسخ فارسی فقط از حروف الفبای فارسی (از جمله «آ») باشد، بدون فاصله و بدون نیم‌فاصله. هر حرف یک خانه است.
- پاسخ انگلیسی فقط از حروف بزرگ `A-Z` باشد.
- طول پاسخ بین ۳ و ۹ حرف باشد.
- سرنخ باید روشن باشد و هیچ‌وقت خود پاسخ را در بر نگیرد.

بعد از ویرایش، `npm test` را اجرا کنید تا کلمه‌های نامعتبر یا تکراری گزارش شوند.

## آزمون و ابزارها

```bash
npm test              # بررسی بانک واژگان، ساخت جدول برای ۲۰ مرحله در هر دو زبان با چند seed، و شبیه‌سازی جلسهٔ بازی
npm run test:quick    # نسخهٔ سریع‌تر
npm run export        # ساخت ۲۰ جدول نمونه برای هر زبان در پوشهٔ puzzles/
```

ابزار خروجی گزینه‌های بیشتری دارد:

```bash
node tools/export-puzzles.js --lang=fa --per-level=3 --out=./my-puzzles --seed=2026
```

دو فایل `puzzles/sample-fa.json` و `puzzles/sample-en.json` هرکدام شامل ۲۰ جدول آماده (یک جدول برای هر مرحله) هستند که می‌توانید در پروژه‌های دیگر هم استفاده کنید.

## ساختار پروژه

```
chistan-crossword/
├── index.html              صفحهٔ اصلی
├── css/style.css           ظاهر بازی (تم روشن و تیره، RTL و LTR)
├── js/
│   ├── generator.js        موتور تولید و اعتبارسنجی جدول
│   ├── words-fa.js         بانک واژگان فارسی
│   ├── words-en.js         بانک واژگان انگلیسی
│   ├── i18n.js             متن‌های رابط کاربری به دو زبان
│   └── app.js              منطق بازی و رابط کاربری
├── fonts/                  فونت‌های Vazirmatn و Lalezar (مجوز OFL)
├── tests/verify.js         آزمون خودکار
├── tools/                  export-puzzles.js و serve.js
├── puzzles/                جدول‌های نمونه (JSON)
├── docs/                   تصاویر README
└── .github/workflows/      اجرای خودکار آزمون در GitHub Actions
```

## مرورگرهای پشتیبانی‌شده

نسخه‌های اخیر Chrome، Edge، Firefox و Safari (برای `<dialog>` و `color-mix` نسخه‌های ۲۰۲۳ به بعد).

## مشارکت

پیشنهادها و Pull Requestها خوشحالمان می‌کنند. ساده‌ترین مشارکت افزودن کلمه و سرنخ‌های خوب است. لطفاً پیش از ارسال `npm test` را اجرا کنید.

## مجوز

کد پروژه با مجوز [MIT](LICENSE) منتشر شده است. فونت‌های Vazirmatn و Lalezar تحت مجوز SIL Open Font License 1.1 هستند (فایل‌های `fonts/LICENSE-*.txt`).

</div>

---

<a id="en"></a>

# English

Chistan (چیستان, "riddle" in Persian) is a crossword game that runs entirely in the browser. Each puzzle is a connected grid of words. You read the across and down clues and type the answers letter by letter. It works in Persian (right-to-left) and English (left-to-right), with no dependencies and no build step.

## Features

- **20 levels from tiny to giant.** From a 6×6 grid with 4 words up to a 21×21 grid with 32 words, in five tiers: Mini, Small, Medium, Large and Giant.
- **Random and endless.** A fresh puzzle is generated every time you start a level, so each level holds unlimited puzzles instead of one fixed grid.
- **No repeats.** The game remembers recently used words and the layout signature of earlier puzzles in your browser and avoids them. In a test of 120 puzzles in a row per language, none repeated and two consecutive puzzles shared only about 1% to 2% of their words on average.
- **Both languages.** Persian and English word banks (300+ words each, every word with a clue) and an on-screen keyboard for each language. In Persian mode, typing on an English keyboard layout is mapped to the standard Persian layout.
- **Helpers.** Check for wrong cells, reveal a letter, reveal a word, clear, and show the full answer.
- **Autosave.** An unfinished game, its timer, your best time per level and your progress are saved in the browser, separately for each language.
- **Beautiful, responsive UI.** Inspired by Iranian tile work, with light and dark themes, bundled Persian fonts (works offline), for phone and desktop.
- **Accessible.** Full keyboard play, visible focus, and `prefers-reduced-motion` support.

<table>
  <tr>
    <td><img src="docs/home-fa.png" alt="Level selection" width="360"></td>
    <td><img src="docs/game-en-dark.png" alt="English puzzle, dark theme" width="360"></td>
    <td><img src="docs/mobile-fa.png" alt="Mobile layout" width="160"></td>
  </tr>
</table>

## Run it

The simplest way: open `index.html` in a browser.

Or use the tiny local server (Node.js 16 or newer):

```bash
git clone https://github.com/<your-user>/chistan-crossword.git
cd chistan-crossword
npm start            # then open http://localhost:8080 in your browser
```

### Publish on GitHub Pages

1. Push the project to GitHub.
2. Go to **Settings → Pages** in the repository.
3. Under Source choose **Deploy from a branch**, pick the `main` branch and the `/ (root)` folder, then save.
4. After a few minutes the game is live at `https://<your-user>.github.io/chistan-crossword/`.

## How to play

| Action | How |
|---|---|
| Select a cell | Click or tap it |
| Switch direction (across/down) | Click the same cell again, or press `Space` |
| Enter a letter | On-screen keyboard or your own keyboard |
| Delete a letter | `Backspace` or the delete key on the on-screen keyboard |
| Move around | Arrow keys |
| Next / previous clue | `Enter` / `Shift`+`Enter` |
| Jump to a clue | Click it in the clue list |

Note: "Reveal letter" and "Reveal word" disqualify the puzzle from setting a best time. "Show answers" does not count the puzzle as solved in your progress.

## Levels

| Tier | Levels | Maximum grid size | Words |
|---|---|---|---|
| Mini | 1 to 4 | 6×6 to 8×8 | 4 to 7 |
| Small | 5 to 8 | 9×9 to 11×11 | 8 to 11 |
| Medium | 9 to 12 | 11×11 to 13×13 | 12 to 15 |
| Large | 13 to 16 | 14×14 to 16×16 | 17 to 22 |
| Giant | 17 to 20 | 17×17 to 21×21 | 24 to 32 |

A generated grid is always trimmed to fit its words, so its real size can be a little smaller than the maximum. Every level is defined in the `LEVELS` array in `js/generator.js`.

## How puzzle generation works

1. A random seed is drawn with `crypto.getRandomValues` and fed to the `mulberry32` pseudo-random generator. The same seed always gives the same puzzle, which makes puzzles reproducible and testable.
2. Words that fit the level (by length) are taken from the word bank. Recently used words go to the back of the queue.
3. A long word is placed near the center and the others are added one by one, crossing existing words. A placement is only accepted if it never touches another word side by side and shares letters only at proper crossings.
4. This is repeated several times with different orderings, and the best result wins (reaching the target word count, more crossings, a compact and nearly square grid).
5. If the puzzle signature (an FNV-1a hash of the words and their positions) was already seen, the puzzle is generated again.
6. The `validate` function independently re-checks the finished puzzle: letters, bounds, connectivity and the absence of accidental words.

On a desktop computer, generating even the largest level took under 50 ms in our tests (older phones may take a little longer).

## Adding words and clues

`js/words-fa.js` and `js/words-en.js` hold lists of `[answer, clue]` pairs:

```js
['شیراز', 'شهر حافظ و سعدی'],   // js/words-fa.js
['TIGER', 'Big striped cat'],    // js/words-en.js
```

Rules:

- Persian answers use only the letters of the Persian alphabet (including «آ»), with no spaces and no zero-width non-joiner. One letter is one cell.
- English answers use uppercase `A-Z` only.
- Answers are 3 to 9 letters long.
- A clue must be clear and must never contain the answer itself.

After editing, run `npm test` to catch invalid or duplicate entries.

## Tests and tools

```bash
npm test              # word bank checks, puzzles for all 20 levels in both languages across several seeds, and a play-session simulation
npm run test:quick    # faster version
npm run export        # write 20 sample puzzles per language to puzzles/
```

The export tool has more options:

```bash
node tools/export-puzzles.js --lang=en --per-level=3 --out=./my-puzzles --seed=2026
```

`puzzles/sample-fa.json` and `puzzles/sample-en.json` each contain 20 ready-made puzzles (one per level) that you can reuse in other projects.

## Project structure

```
chistan-crossword/
├── index.html              entry page
├── css/style.css           look and feel (light/dark, RTL and LTR)
├── js/
│   ├── generator.js        puzzle generator and validator
│   ├── words-fa.js         Persian word bank
│   ├── words-en.js         English word bank
│   ├── i18n.js             UI strings in both languages
│   └── app.js              game logic and UI
├── fonts/                  Vazirmatn and Lalezar fonts (OFL)
├── tests/verify.js         automated tests
├── tools/                  export-puzzles.js and serve.js
├── puzzles/                sample puzzles (JSON)
├── docs/                   README images
└── .github/workflows/      tests on GitHub Actions
```

## Browser support

Recent versions of Chrome, Edge, Firefox and Safari (2023 or newer, for `<dialog>` and `color-mix`).

## Contributing

Suggestions and pull requests are welcome. The easiest contribution is adding good words and clues. Please run `npm test` before submitting.

## License

The code is released under the [MIT](LICENSE) license. The Vazirmatn and Lalezar fonts are under the SIL Open Font License 1.1 (see `fonts/LICENSE-*.txt`).
