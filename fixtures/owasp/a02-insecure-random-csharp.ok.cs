using System.Security.Cryptography;

class TokenService
{
    public int RollDice()
    {
        var diceRoll = new Random().Next(1, 6);
        return diceRoll;
    }

    public string GenerateApiToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return System.Convert.ToBase64String(bytes);
    }
}
