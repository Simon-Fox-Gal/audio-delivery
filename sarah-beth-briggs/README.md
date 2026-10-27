# Sarah Beth Briggs: Beethoven master fileset

Master fileset: 27 October 2026. Source: ten WAVs in the linked Google Drive folder, 44,100 Hz, 24-bit stereo. Each original WAV has been renamed in place with the suffix `2026 REMASTER` immediately before `.wav`; its audio bytes, Drive ID, sharing and placement are unchanged. `Beethoven compilation master 271026.zip` has been rebuilt with the ten renamed WAVs and replaces the previous ZIP in place, retaining its Drive ID and download link. The ZIP entries were checked byte-for-byte against the downloaded source WAVs, with no omissions or duplicates.

The continuous listening copy concatenates the complete source PCM, in track order, without adding, removing or crossfading samples. The CD's initial two-second lead-in is not added. Audio duration: 4,571.786666666667 seconds. Encoding: libmp3lame, 320,000 bits/second, 44,100 Hz stereo. Ten ID3 chapter markers are included. The continuous MP3 is stored as ordered binary parts because it exceeds GitHub's single-file limit; `media.json` declares the order and expected sizes. The browser verifies sizes and assembles the original MP3 as a Blob. No audio is decoded or re-encoded in the browser.

`tracks.json` records exact source sample counts, cumulative start times, titles and Drive IDs. Track marker times are measured from the first audio sample, rather than the CD absolute timeline. Duration labels are truncated to whole seconds for display.

Nine standalone join clips contain precisely the last 1,323,000 samples per channel of the preceding WAV and the first 220,500 samples of the next WAV. They are encoded once at 320 kbps; each decodes to 1,543,500 samples per channel (35 seconds). The join is at 30 seconds. There are no fades or added gaps. Native playback ends at the clip end, with a time-update stop as an additional guard.

Validation: JavaScript syntax; exact sample counts after decoding the continuous MP3 and each clip; byte-for-byte reconstruction of the continuous file; uploaded Git blob hashes against local files. Browser playback needs final human listening checks. Google Drive controls individual WAV preview and large-file download prompts.

The listening audio, track sequence, sample counts, start times and join clips are unchanged from the 20 October delivery. Only master filenames, the ZIP package and delivery wording have changed.
