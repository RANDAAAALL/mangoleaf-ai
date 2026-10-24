package com.mangoleaf.ai;

import static org.junit.Assert.*;
import android.content.ComponentName;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.drawable.AdaptiveIconDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.VectorDrawable;
import android.util.TypedValue;
import android.view.ContextThemeWrapper;
import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.filters.SdkSuppress;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Package, archive and launcher icons share the white-backed leaf; startup uses its separate leaf. */
@RunWith(AndroidJUnit4.class)
@SdkSuppress(minSdkVersion = 26)
public final class NativeBrandingTest {
    @Test public void packageAndLauncherUseTheSameWhiteBackedLeaf() throws Exception {
        Context context = ApplicationProvider.getApplicationContext();
        PackageManager manager = context.getPackageManager();
        ApplicationInfo application = manager.getApplicationInfo(context.getPackageName(), 0);
        ActivityInfo launcher = manager.getActivityInfo(new ComponentName(context, MainActivity.class), 0);

        assertEquals(R.mipmap.ic_launcher, application.icon);
        assertWhiteBackground(application.loadIcon(manager));
        assertEquals(R.mipmap.ic_launcher, launcher.icon);
        assertWhiteBackground(launcher.loadIcon(manager));
    }

    @Test public void archiveMetadataUsesWhiteBackedLeaf() {
        Context context = ApplicationProvider.getApplicationContext();
        PackageManager manager = context.getPackageManager();
        String apk = context.getApplicationInfo().sourceDir;
        android.content.pm.PackageInfo archive = manager.getPackageArchiveInfo(apk, 0);
        assertNotNull(archive);
        assertNotNull(archive.applicationInfo);
        archive.applicationInfo.sourceDir = apk;
        archive.applicationInfo.publicSourceDir = apk;
        assertEquals(R.mipmap.ic_launcher, archive.applicationInfo.icon);
        assertWhiteBackground(archive.applicationInfo.loadIcon(manager));
    }

    @Test @SdkSuppress(minSdkVersion = 31)
    public void systemSplashRetainsTransparentForegroundWithoutIconPlate() {
        Context context = ApplicationProvider.getApplicationContext();
        ContextThemeWrapper themed = new ContextThemeWrapper(context, R.style.AppTheme);
        TypedValue icon = new TypedValue();
        assertTrue(themed.getTheme().resolveAttribute(android.R.attr.windowSplashScreenAnimatedIcon, icon, true));
        assertEquals(R.drawable.ic_leaf_foreground, icon.resourceId);
        Drawable splashIcon = themed.getDrawable(icon.resourceId);
        assertTrue(splashIcon instanceof VectorDrawable);
        assertTransparentCorners(splashIcon);

        TypedValue background = new TypedValue();
        assertTrue(themed.getTheme().resolveAttribute(android.R.attr.windowSplashScreenIconBackgroundColor,
            background, true));
        assertEquals(Color.TRANSPARENT, background.data);
    }

    private static void assertTransparentCorners(Drawable drawable) {
        Bitmap bitmap = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888);
        try {
            drawable.setBounds(0, 0, bitmap.getWidth(), bitmap.getHeight());
            drawable.draw(new Canvas(bitmap));
            assertEquals(0, Color.alpha(bitmap.getPixel(0, 0)));
            assertEquals(0, Color.alpha(bitmap.getPixel(95, 0)));
            assertEquals(0, Color.alpha(bitmap.getPixel(0, 95)));
            assertEquals(0, Color.alpha(bitmap.getPixel(95, 95)));
        } finally { bitmap.recycle(); }
    }

    private static void assertWhiteBackground(Drawable drawable) {
        assertTrue(drawable instanceof AdaptiveIconDrawable);
        AdaptiveIconDrawable icon = (AdaptiveIconDrawable) drawable;
        assertTrue(icon.getForeground() instanceof VectorDrawable);
        Drawable background = icon.getBackground();
        Bitmap bitmap = Bitmap.createBitmap(96, 96, Bitmap.Config.ARGB_8888);
        try {
            background.setBounds(0, 0, 96, 96);
            background.draw(new Canvas(bitmap));
            // Inspect the supplied layer rather than a launcher/OEM mask or shadow.
            for (int y = 0; y < 96; y++) {
                for (int x = 0; x < 96; x++) assertEquals(Color.WHITE, bitmap.getPixel(x, y));
            }
        } finally { bitmap.recycle(); }
    }
}
