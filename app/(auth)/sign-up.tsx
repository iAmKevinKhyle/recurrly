import { View, Text } from "react-native";
import React from "react";
import { Link } from "expo-router";

const SignUp = () => {
  return (
    <View>
      <Text>sign-up</Text>
      <Link
        href={"/(auth)/sign-in"}
        className="mt-4 rounded bg-primary text-white p-4"
      >
        Sign in here
      </Link>
      <Link href={"/"} className="mt-4 rounde">
        Go home
      </Link>
    </View>
  );
};

export default SignUp;
