namespace VerySimpleFileHost.Utils;

public static class ValidationUtils
{
    public static bool ValidateRange(
        int value,
        int minimum,
        int maximum,
        string valueName,
        out string errorMessage)
    {
        if(value < minimum || value > maximum)
        {
            errorMessage = $"{valueName} must be between {minimum} and {maximum}";
            return false;
        }
        errorMessage = "";
        return true;
    }

    public static bool ValidatePositiveOrNull(
        double? value,
        string valueName,
        out string errorMessage)
    {
        if(value.HasValue && value <= 0.0d)
        {
            errorMessage = $"{valueName} must be positive";
            return false;
        }
        errorMessage = "";
        return true;
    }
}