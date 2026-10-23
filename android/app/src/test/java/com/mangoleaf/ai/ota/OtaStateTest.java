package com.mangoleaf.ai.ota;

import static org.junit.Assert.*;
import java.util.ArrayList;
import java.util.List;
import org.junit.Test;

public class OtaStateTest {
    @Test public void failedFirstLaunchRollsBackAndCannotReplaySequence() {
        OtaState state = new OtaState(1);
        state.active = "2-aaaaaaaaaaaaaaaa";
        state.highWater = 2;
        state.stage("3-bbbbbbbbbbbbbbbb", 3);
        state.activatePending(3);
        state.beginLaunch();
        state.recoverInterruptedLaunch();
        assertEquals("2-aaaaaaaaaaaaaaaa", state.active);
        assertEquals("", state.pending);
        assertEquals(3, state.highWater);
        assertThrows(IllegalArgumentException.class, () -> state.stage("3-bbbbbbbbbbbbbbbb", 3));
    }

    @Test public void healthyLaunchSurvivesRestart() {
        OtaState state = new OtaState(1);
        state.stage("2-aaaaaaaaaaaaaaaa", 2);
        state.activatePending(2);
        state.beginLaunch();
        state.markHealthy(state.active);
        state.recoverInterruptedLaunch();
        assertEquals("2-aaaaaaaaaaaaaaaa", state.active);
        assertEquals("", state.booting);
    }

    @Test public void staleAcknowledgementCannotApproveDifferentBundle() {
        OtaState state = new OtaState(1);
        state.active = "2-aaaaaaaaaaaaaaaa";
        state.beginLaunch();
        state.markHealthy("another-bundle");
        assertEquals(state.active, state.booting);
    }

    @Test public void failureWithoutPreviousBundleFallsBackToApkAssets() {
        OtaState state = new OtaState(1);
        state.stage("2-aaaaaaaaaaaaaaaa", 2);
        state.activatePending(2);
        state.beginLaunch();
        state.recoverInterruptedLaunch();
        assertEquals("", state.active);
        assertEquals(2, state.highWater);
    }

    @Test public void repeatedCheckPreservesStagedStatusUntilLaunch() {
        OtaState state = new OtaState(1);
        assertEquals("up-to-date", state.currentStatus());
        state.stage("2-aaaaaaaaaaaaaaaa", 2);
        assertEquals("staged", state.currentStatus());
        state.activatePending(2);
        assertEquals("up-to-date", state.currentStatus());
    }

    @Test public void activatedPendingIsVerifiedOnceButLaterLaunchVerifiesAgain() {
        OtaState state = new OtaState(1);
        String candidate = "2-aaaaaaaaaaaaaaaa";
        state.stage(candidate, 2);
        List<String> reads = new ArrayList<>();
        assertFalse(state.selectLaunch(1, id -> { reads.add(id); return 2L; }));
        assertEquals(List.of(candidate), reads);
        state.beginLaunch();
        state.markHealthy(candidate);
        state.selectLaunch(1, id -> { reads.add(id); return 2L; });
        assertEquals(List.of(candidate, candidate), reads);
    }

    @Test public void invalidPendingCannotLendItsVerificationToAnotherActiveBundle() {
        OtaState state = new OtaState(1);
        String active = "2-aaaaaaaaaaaaaaaa";
        String pending = "3-bbbbbbbbbbbbbbbb";
        state.active = active;
        state.stage(pending, 3);
        List<String> reads = new ArrayList<>();
        state.selectLaunch(1, id -> { reads.add(id); return id.equals(active) ? 2L : null; });
        assertEquals(List.of(pending, active), reads);
        assertEquals(active, state.active);
        assertEquals("", state.pending);
    }

    @Test public void recoveryVerifiesFallbackAndPreservesConsumedSequence() {
        OtaState state = new OtaState(1);
        String previous = "2-aaaaaaaaaaaaaaaa";
        state.active = previous;
        state.stage("3-bbbbbbbbbbbbbbbb", 3);
        state.activatePending(3);
        state.beginLaunch();
        List<String> reads = new ArrayList<>();
        assertTrue(state.selectLaunch(1, id -> { reads.add(id); return 2L; }));
        assertEquals(List.of(previous), reads);
        assertEquals(previous, state.active);
        assertEquals(3, state.highWater);
    }

    @Test public void rendererFailureEvidenceRequiresExactUnacknowledgedOta() {
        OtaState state = new OtaState(1);
        assertFalse(state.isUnacknowledgedLaunch(""));
        state.active = "2-aaaaaaaaaaaaaaaa";
        state.beginLaunch();
        assertTrue(state.isUnacknowledgedLaunch(state.active));
        assertFalse(state.isUnacknowledgedLaunch("3-bbbbbbbbbbbbbbbb"));
        state.markHealthy(state.active);
        assertFalse(state.isUnacknowledgedLaunch(state.active));
    }
}
