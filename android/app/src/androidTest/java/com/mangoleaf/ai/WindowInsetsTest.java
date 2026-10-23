package com.mangoleaf.ai;

import static org.junit.Assert.*;
import android.content.Context;
import android.view.View;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Measure a real WebView: internal padding must not masquerade as a smaller HTML viewport. */
@RunWith(AndroidJUnit4.class)
public final class WindowInsetsTest {
    private void layout(FrameLayout container, int width, int height) {
        container.measure(View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY));
        container.layout(0, 0, width, height);
    }

    @Test public void viewportAvoidsStatusAndThreeButtonNavigationWithoutDoubleInsets() {
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            Context context = ApplicationProvider.getApplicationContext();
            WebView web = new WebView(context);
            try {
                FrameLayout container = MainActivity.createInsetContent(context, web);
                WindowInsetsCompat bars = new WindowInsetsCompat.Builder()
                    .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.of(0, 72, 0, 144)).build();
                assertTrue(ViewCompat.dispatchApplyWindowInsets(container, bars).isConsumed());
                // A second dispatch must replace the space instead of accumulating it.
                ViewCompat.dispatchApplyWindowInsets(container, bars);
                layout(container, 1080, 2400);
                assertEquals(72, web.getTop());
                assertEquals(2256, web.getBottom());
                assertEquals(1080, web.getWidth());
                assertEquals(2184, web.getHeight());
                assertEquals(0, web.getPaddingTop());
                assertEquals(0, web.getPaddingBottom());
            } finally { web.destroy(); }
        });
    }

    @Test public void rotationCutoutAndKeyboardUseLargestInsetAndReleaseOldSpace() {
        InstrumentationRegistry.getInstrumentation().runOnMainSync(() -> {
            Context context = ApplicationProvider.getApplicationContext();
            WebView web = new WebView(context);
            try {
                FrameLayout container = MainActivity.createInsetContent(context, web);
                WindowInsetsCompat keyboard = new WindowInsetsCompat.Builder()
                    .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.of(0, 72, 0, 24))
                    .setInsets(WindowInsetsCompat.Type.ime(), Insets.of(0, 0, 0, 900)).build();
                ViewCompat.dispatchApplyWindowInsets(container, keyboard);
                layout(container, 1080, 2400);
                assertEquals(1500, web.getBottom());
                // Landscape navigation and cutouts must replace portrait/keyboard padding on all sides.
                WindowInsetsCompat landscape = new WindowInsetsCompat.Builder()
                    .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.of(0, 24, 72, 0))
                    .setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.of(96, 0, 0, 0)).build();
                ViewCompat.dispatchApplyWindowInsets(container, landscape);
                layout(container, 2400, 1080);
                assertEquals(96, web.getLeft());
                assertEquals(24, web.getTop());
                assertEquals(2328, web.getRight());
                assertEquals(1080, web.getBottom());
                assertEquals(0, web.getPaddingLeft());
            } finally { web.destroy(); }
        });
    }
}
