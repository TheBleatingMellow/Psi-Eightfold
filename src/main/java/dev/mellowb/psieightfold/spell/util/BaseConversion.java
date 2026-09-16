package dev.mellowb.psieightfold.spell.util;

import java.math.BigInteger;

public final class BaseConversion {
    private BaseConversion() {}

    public static String decToHex(Number value) {
        return BigInteger.valueOf(value.longValue()).toString(16).toUpperCase();
    }

    public static double hexToDec(String value) {
        String s = value.trim();
        if (s.startsWith("#")) s = s.substring(1);
        if (s.startsWith("0x") || s.startsWith("0X")) s = s.substring(2);
        return new BigInteger(s, 16).doubleValue();
    }

    public static String convert(String value, int fromBase, int toBase) {
        if (fromBase < 2 || fromBase > 12 || toBase < 2 || toBase > 12) {
            throw new IllegalArgumentException("Bases must be between 2 and 12");
        }
        return new BigInteger(value.trim().toUpperCase(), fromBase).toString(toBase).toUpperCase();
    }
}
