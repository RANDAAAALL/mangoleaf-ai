package com.mangoleaf.ai.ota;

import java.util.function.Function;

/** Pure transition rules make recovery behavior testable without an Android device. */
public final class OtaState {
    public String active = "";
    public String previous = "";
    public String pending = "";
    public String booting = "";
    public long highWater;

    public OtaState(long baseline) { highWater = baseline; }

    /** An unacknowledged launch cannot become the next known-good fallback. */
    public void recoverInterruptedLaunch() {
        if (!booting.isEmpty()) {
            active = previous;
            previous = "";
            pending = "";
            booting = "";
        }
    }

    /** Verify each selected directory once per launch; no verification survives into another launch. */
    public boolean selectLaunch(long baseline, Function<String, Long> verifiedSequence) {
        boolean recovering = !booting.isEmpty();
        recoverInterruptedLaunch();
        String verifiedPending = "";
        if (!pending.isEmpty()) {
            Long sequence = verifiedSequence.apply(pending);
            if (sequence != null && sequence > baseline) {
                verifiedPending = pending;
                activatePending(sequence);
            } else pending = "";
        }
        if (!active.isEmpty() && !active.equals(verifiedPending) && verifiedSequence.apply(active) == null) {
            active = previous;
            previous = "";
            if (!active.isEmpty() && verifiedSequence.apply(active) == null) active = "";
            recovering = true;
        }
        return recovering;
    }

    /** A renderer failure is rollback evidence only before this exact OTA launch acknowledges readiness. */
    public boolean isUnacknowledgedLaunch(String launched) {
        return !launched.isEmpty() && active.equals(launched) && booting.equals(launched);
    }

    public void activatePending(long sequence) {
        previous = active;
        active = pending;
        pending = "";
        highWater = Math.max(highWater, sequence);
    }

    public void stage(String id, long sequence) {
        if (sequence <= highWater) throw new IllegalArgumentException("Update sequence must increase.");
        pending = id;
        // An accepted sequence remains consumed even when its first launch fails.
        highWater = sequence;
    }

    public void beginLaunch() { booting = active; }

    public void markHealthy(String launched) {
        if (active.equals(launched)) booting = "";
    }

    /** A repeated metadata check must not hide an update waiting for restart. */
    public String currentStatus() { return pending.isEmpty() ? "up-to-date" : "staged"; }
}
