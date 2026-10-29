# Listening Edition — reusable design system
## The *De profundis* reference implementation · 29 October 2026

This page is the reference for future Simon Fox-Gál classical-recording listening editions. It combines the emotional specificity of a given musical work with the reliability of a technical delivery page.

### Design principle

**The recording generates its own artwork.** Avoid generic sound-wave decoration or stock imagery. Extract an abstract visual identity from the actual audio; make it legible as an engraving or landscape rather than a DAW waveform.

The *De profundis* visual study is called **From the Depths**. Measured music-energy changes produce an etched terrain, with spectral and transient variations influencing the individual contours. Editorial typography and abundant warm-paper negative space contrast with the dark technical listening console. Bronze is used as a restrained positioning accent, not as decoration everywhere.

### Visual vocabulary

- **Primary paper:** `#f0eee8`; **ink:** `#151a1c`; **secondary copy:** `#59615f`
- **Fine rules:** `#c7c6bf`; **archive bronze:** `#957452`
- **Technical panel:** `#151b1e`; **panel secondary:** `#1b2326`
- **Playback signal:** `#dac19c`
- **Expressive serif:** Cormorant Garamond, with Georgia as fallback
- **Text and instrument labels:** DM Sans, with a system sans-serif fallback

Typography should establish a pronounced contrast between one monumental, work-specific title and very small archival annotation. Sections are composed as an intentional progression: **work → artwork → listening → formats → documentation**.

### Artwork pipeline

The version-controlled workflow [build-de-profundis-relief.yml](../../.github/workflows/build-de-profundis-relief.yml) obtains the current link-shared audio master and creates:

- `audio/sound-relief.json` — 640 time-ordered analysis windows with normalized RMS, spectral centroid, envelope change and crest factor.
- `audio/sound-relief.svg` — a detailed, accessible, lightweight static engraving generated from those measurements.

The SVG is a designed interpretation of measured audio. It is **not** a literal waveform or an analytical frequency chart. The five movement intervals are aligned with the same timeline used by the audio player. The gold playhead and keyboard-accessible seek surface map onto that duration.

For another recording, replace the audio source, duration, movement titles/boundaries and related credits before regenerating the artwork. Review the rendering rather than assuming one set of artistic parameters suits every work.

### Functional contract

- One continuous stream, with direct-seek movement buttons that **do not interrupt** the recording.
- The artwork and playback timeline both seek within the same audio element.
- Stereo meters visualise decoded audio and hold each channel's measured peak and numerical dBFS readout for **five seconds**. These are *preview meters*, not calibrated broadcast PPM or true-peak metering.
- Clear volume, pause and previous/next-movement controls.
- Accessible controls, visible focus, keyboard seeking and reduced-motion considerations.
- The high-resolution WAV archive and complete MP3 must remain easy to download. The listening stream's compressed format is identified accurately and is not described as a master.
- Credit performers and on-site engineers clearly. Do not infer publishing or performance rights from the presence of a listening link.

### Quality assurance

The reusable [visual QA workflow](../../.github/workflows/visual-qa-deprofundis.yml) verifies the script syntax, five movement controls, download paths, five-second peak hold and actual-audio SVG. It also renders **full-page desktop/mobile screenshots** and tests movement-seeking when the stream is available.

The intended standard is *authored rather than decorated*: visual imagination should be concentrated in the single music-derived focal element, leaving navigation, downloads and documentation calm.

### Preserving earlier versions

The live page is `de-profundis-agm-preview/index.html` in `Simon-Fox-Gal/audio-delivery`. Every design pass is available in Git history. The version directly preceding the audio-derived redesign was commit `db3f4d8cb2299321ab54a19c60a3e8c54f46f618` (with subsequent language/functional refinements preserved in later commits).
